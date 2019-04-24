const axios = require('./utils/axios');
const weiboUtils = require('./utils/weibo');
const config = require('./config');
const SCKEY = config.sckey;
const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36';
const headers = {
    'User-Agent': ua,
    Referer: 'https://m.weibo.cn/',
}

// example:
// '保护小洁': {
//     pushedIds: []
// }
let store = {};

// 获取ContainerId
const getContainerIdURL = (userId) => {
    return `https://m.weibo.cn/api/container/getIndex?type=uid&value=${userId}`;
};

// 获取微博数据(10条)
const getWeiBoDataURL = (userId, containerId) => {
    return `https://m.weibo.cn/api/container/getIndex?type=uid&value=${userId}&containerid=${containerId}`;
}

// 获取微博数据
const fetchWeiBoData = async (userId) => {
    let userName;
    let containerId;
    try {
        const containerResponse = await axios({
            method: 'get',
            url: getContainerIdURL(userId),
            headers: headers
        });
        userName = containerResponse.data.data.userInfo.screen_name;
        // console.log(`${new Date()} - 正在监控「${userName}」`)
        console.log(`${new Date} - keep alive....`)
        containerId = containerResponse.data.data.tabsInfo.tabs[1].containerid;
        const response = await axios({
            method: 'get',
            url: getWeiBoDataURL(userId, containerId),
            headers: headers
        });
        let items = response.data.data.cards.filter((item) => item.mblog && !item.mblog.isTop && item.mblog.created_at === '刚刚').map((item) => {
            return {
                id: item.mblog.id,
                link: `微博链接：https://weibo.com/${userId}/${item.mblog.bid}`
            };
        });
        push2WeChat(userId, userName, items);
    } catch (error) {
        console.error(error);
    }
}

const push2WeChat = (userId,userName, items) => {
    items.forEach((item) => {
        // 推送过的不再推送
        if (store[`${userId}`].includes(item.id)) {
            return
        }
        axios.get(`https://sc.ftqq.com/${SCKEY}.send`, {
            params: {
                text: `${userName}发表了新微博`,
                desp: item.link
            }
        }).then(function (response) {
            store[`${userId}`].push(item.id);
            console.log(`「${userName}」的新微博已成功推送到微信`);
        }).catch(function (error) {
            console.error(error);
        });
    })

};

process.argv.forEach((userId, index) => {
    store[`${userId}`]=[]
    if (index >= 2) {
        setInterval(function () {
            fetchWeiBoData(userId)
        }, config.frequency)
    }
});
