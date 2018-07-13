const axios = require('./utils/axios');
const weiboUtils = require('./utils/weibo');
const config = require('./config');


var main = async (uid, compareKey) => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36';

    let name = '', containerid = '', data;
    try {
        const containerResponse = await axios({
            method: 'get',
            url: `https://m.weibo.cn/api/container/getIndex?type=uid&value=${uid}`,
            headers: {
                'User-Agent': ua,
                Referer: 'https://m.weibo.cn/',
            },
        });
        name = containerResponse.data.data.userInfo.screen_name;
        containerid = containerResponse.data.data.tabsInfo.tabs[1].containerid;
    } catch (error) {
        console.error(error);
    }

    try {
        const response = await axios({
            method: 'get',
            url: `https://m.weibo.cn/api/container/getIndex?type=uid&value=${uid}&containerid=${containerid}`,
            headers: {
                'User-Agent': ua,
                Referer: `https://m.weibo.cn/u/${uid}`,
            }
        });
        data = {
            title: `${name}的微博`,
            link: `http://weibo.com/${uid}/`,
            description: `${name}的微博`,
            item: response.data.data.cards.filter((item) => item.mblog && !item.mblog.isTop).map((item) => {
                const title = item.mblog.text.replace(/<img.*?>/g, '[图片]').replace(/<.*?>/g, '');
                return {
                    title: title.length > 24 ? title.slice(0, 24) + '...' : title,
                    description: weiboUtils.format(item.mblog),
                    pubDate: weiboUtils.getTime(item.mblog.created_at),
                    link: `https://weibo.com/${uid}/${item.mblog.bid}`,
                };
            }),
        };
    } catch (error) {
        console.error(error);
    }

    if (!compareKey) {
        console.log(`开始监听${name}的新微博`);
    } else if (data && compareKey !== data.item[0].link) {
        push2WeChat(name, data.item[0])
    } else {
        console.log(`${name}没有新微博(${Date()})`);
    }
    setTimeout(() => {
        main(uid, data.item[0].link)
    }, config.frequency);
};

var push2WeChat = (userName, data) => {
    const SCKEY = config.sckey;
    axios.get(`https://sc.ftqq.com/${SCKEY}.send`, {
        params: {
            text: `${userName}发表了新微博`,
            desp: data
        }
    }).then(function (response) {
        console.log(`${userName}的新微博已成功推送到微信`);
    }).catch(function (error) {
        console.error(error);
    });
};

process.argv.forEach((val, index) => {
    if (index >= 2) {
        main(val)
    }
});
