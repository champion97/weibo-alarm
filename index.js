const axios = require('./utils/axios');
const weiboUtils = require('./utils/weibo');
const config = require('./config')



main = async (uid) => {
    let link = ''
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36';

    const containerResponse = await axios({
        method: 'get',
        url: `https://m.weibo.cn/api/container/getIndex?type=uid&value=${uid}`,
        headers: {
            'User-Agent': ua,
            Referer: 'https://m.weibo.cn/',
        },
    });
    const name = containerResponse.data.data.userInfo.screen_name;
    const containerid = containerResponse.data.data.tabsInfo.tabs[1].containerid;

    const response = await axios({
        method: 'get',
        url: `https://m.weibo.cn/api/container/getIndex?type=uid&value=${uid}&containerid=${containerid}`,
        headers: {
            'User-Agent': ua,
            Referer: `https://m.weibo.cn/u/${uid}`,
        },
    });

    const data = {
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

    // push
    if(link !== data.item[0].link){
        push2WeChat(name, data.item[0])
    }
    link = data.item[0].link;

    setTimeout(()=>{main()},1000*60*2)
};

push2WeChat = (userName, data)=>{
    const SCKEY = config.sckey;

    axios.get(`https://sc.ftqq.com/${SCKEY}.send`, {
        params: {
            text: `${userName}发表了新微博`,
            desp: `${data.description}(${data.link})`
        }
    }).then(function (response) {
        console.log(`${userName} 发表了新微博`);
    }).catch(function (error) {
    }).then(function () {
    });
};


for (let i = 0; i < config.users.length; i++) {
    main(config.users[i]);
}