// 群发配置
const axios = require("axios");
const request = require("request");
const mlyai = require('./chat/mlyai.js')
const {segment} = require("oicq")
const Auth = require("./auth");
const Utils = require("./utils");


const messageGroupConfig = [
    {
        keywords: ['乐程是什么', '乐程是'],
        reply: [
            segment.image('c78d9d5c7582d8784d0eef74ae1c8b9619967-240-240.jpg'),
            '欢迎加入乐程软件工作室!我们是一个软件工程类团队!\n' +
            '团队有众多成员进入百度阿里腾讯字节等一线互联网公司就业，\n' +
            '更有保研至川大、电子科大等学校进一步深造!\n' +
            '加入我们,和优秀的人一起,用最初的初心做最长久的事!'
        ]
    },
    {
        keywords: ['位置', '地方', '哪里', '在哪', '地点'],
        reply: [segment.location(30.82929175755101, 104.18384454565867,
            '西南石油大学明理楼C1010,乐程在等着你哦')]
    },
    {
        keywords: ['丢骰子', '骰子', '色子'],
        reply: ['我丢~', segment.dice((Math.floor(Math.random() * 1010) % 6))]
    },
    {
        keywords: ['签到'],
        callback: (data) => {
            return new Promise((resolve, reject) => {
                let playLoad = mlyai.getPlayLoad(2, null, data, "签到")
                // console.log(playLoad)
                mlyai.chat(playLoad).then(replies => {
                    let res = []
                    replies.forEach(item => {
                        if (item.typed === 1) {
                            res.push(item.content)
                        }
                    })
                    // console.log(res)
                    resolve(res)
                })
            })
        }
    },
    {
        keywords: ['列表', '菜单', '功能', '你能干啥'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                let fucList = [
                    '乐程是什么',
                    '在哪里 | 位置',
                    '丢骰子',
                    '签到',
                    '天气 (例如: 成都天气)',
                    '微博热搜',
                    '力扣每日一题',
                    '舔狗日记',
                    '二次元',
                    '力扣随机一题',
                    '听首歌 | 网易云音乐',
                    '网易云热评',
                    '高情商聊天: 开启后有更多功能. 发送 "开启聊天" 开始, 发送 "关闭聊天" 结束',
                    '语音模式: 部分回复将以语音的方式发送. 发送 "开启语音" 开始, 发送 "关闭语音" 结束',
                    '即将支持更多功能']

                let prefix = '@ 并回复以下关键字：\n'

                let msg = prefix + fucList.map((value, index) => `${index + 1}. ${value}`).join('\n')
                // console.log(msg)
                resolve(msg)
            })
        }
    },
    {
        keywords: ['你是谁'],
        reply: [
            '我是乐程机器人二号LEC v2.0\n由乐程软件工作室20级成员开发~'
        ]
    },
    {
        keywords: ['天气', '气温'],
        reply: [],
        callback: (data, bot) => {
            return new Promise(resolve => {
                let msgList = data.message
                for (let msg of msgList) {
                    if (msg.type === 'text') {
                        let playLoad = mlyai.getPlayLoad(2, msg, data);
                        // console.log(playLoad)
                        mlyai.chat(playLoad).then(replies => {
                            let res = []
                            replies.forEach(item => {
                                if (item.typed === 1) {
                                    res.push(item.content)
                                }
                            })
                            // console.log(res)
                            resolve(res)
                        })
                        return
                    }
                }
            })
        }
    },
    {
        keywords: ['微博热搜', '热搜', '微博'],
        reply: [],
        callback: (data, bot) => {
            return new Promise(resolve => {

                axios.get("https://v2.alapi.cn/api/new/wbtop?num=15&token=aCPgupefjrIOitsa").then(res => {
                    let s = []
                    if (res.data.code !== 200) {
                        console.warn(res.data)
                        resolve("休息一下吧")
                        return
                    }
                    res.data.data.forEach(e => {
                        s.push(e.hot_word + '\n热度: ' + e.hot_word_num)
                    })
                    // console.log(s.join("\n\n"))
                    resolve(s.join('\n\n'))

                }).catch(e => {
                    console.error("微博热搜接口出错了")
                    console.error(e.message)
                    resolve("微博热搜接口调用出错了")
                })

            })
        }
    },
    {
        keywords: ['每日一题'],
        reply: [],
        callback: function (data, bot) {
            return new Promise((resolve, reject) => {
                // 力扣的蜜汁参数
                const json = {
                    "variables": {},
                    "query": "\n    query questionOfToday {\n  todayRecord {\n    date\n    userStatus\n    question {\n      questionId\n      frontendQuestionId: questionFrontendId\n      difficulty\n      title\n      titleCn: translatedTitle\n      titleSlug\n      paidOnly: isPaidOnly\n      freqBar\n      isFavor\n      acRate\n      status\n      solutionNum\n      hasVideoSolution\n      topicTags {\n        name\n        nameTranslated: translatedName\n        id\n      }\n      extra {\n        topCompanyTags {\n          imgUrl\n          slug\n          numSubscribed\n        }\n      }\n    }\n    lastSubmission {\n      id\n    }\n  }\n}\n    "
                }
                request({
                    method: 'POST',
                    url: 'https://leetcode.cn/graphql',
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify(json)
                }, (error, response, body) => {
                    if (error) {
                        reject(error)
                    } else {
                        let json = JSON.parse(body);
                        let info = json.data.todayRecord[0]
                        let replyMsg = `每日一题 ${info.date}\n名称: ${info.question.title}\n通过率: ${(info.question.acRate * 100).toFixed(2)}% \n难度: ${info.question.difficulty}\n链接: https://leetcode.cn/problems/${info.question.titleSlug}`
                        // console.log(replyMsg)
                        resolve(replyMsg)
                    }
                })
            })
        }
    },
    {
        keywords: ['舔狗日记'],
        callback: (data, bot) => {
            return new Promise(resolve => {

                axios.get("https://v2.alapi.cn/api/dog?token=aCPgupefjrIOitsa&format=json").then(res => {
                    if (res.data.code !== 200) {
                        console.warn('舔狗日记接口 ' + res.data.msg)
                        resolve("休息一下吧")
                        return
                    }
                    // console.log(res.data.data.content)
                    resolve(res.data.data.content)
                }).catch(e => {
                    console.error('舔狗日记接口调用出错了')
                    console.error(e.message)
                    resolve('休息一下吧')
                })

            })
        }
    },
    {
        keywords: ['二次元'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                data.reply('二次元加载中·····')
                axios.get('https://api.vvhan.com/api/acgimg?type=json').then(response => {
                    let res = response.data;
                    if (res.success !== true) {
                        console.log('二次元接口错误')
                        console.log(response.data)
                        resolve('休息一下吧')
                        return
                    }
                    // console.log(response.data)
                    resolve(segment.image(res.imgurl))
                }).catch((e) => {
                    console.error('二次元接口出错了, 休息一下吧')
                    console.error(e.message)
                    resolve('休息一下吧, 二次元加载不出来了!')
                })

            })
        }
    },
    {
        keywords: ['随机一题', '来道题', '力扣一题', '力扣题'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                let para = {
                    "query": "\n    query problemsetRandomFilteredQuestion($categorySlug: String!, $filters: QuestionListFilterInput) {\n  problemsetRandomFilteredQuestion(categorySlug: $categorySlug, filters: $filters)\n}\n    ",
                    "variables": {"categorySlug": "", "filters": {}}
                }
                axios({
                    url: 'https://leetcode.cn/graphql/',
                    data: JSON.stringify(para),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(res => {
                    try {
                        let problemName = res.data.data.problemsetRandomFilteredQuestion;
                        let msg = 'https://leetcode.cn/problems/' + problemName
                        // console.log(msg)
                        resolve("随机一题\n链接: " + msg)
                    } catch (e) {
                        console.log('LeetCode接口调用错误')
                        console.error(e);
                        resolve('休息一下吧')
                    }
                }).catch(e => {
                    console.error('LeetCode接口调用错误')
                    console.error(e.message);
                    resolve("休息一下吧")
                })
            })
        }
    },
    {
        keywords: ['歌', '网易云音乐', '网抑云'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                axios.get(encodeURI("https://api.uomg.com/api/rand.music?sort=热歌榜&format=json")).then(res => {
                        if (res.data.code !== 1) {
                            console.warn('网易云接口调用出错')
                            console.log(res.data)
                            resolve("休息一下吧")
                            return
                        }
                        resolve(segment.music('163', res.data.data.url.split('=')[1]))
                    }
                ).catch(e => {
                    console.error('网易云接口调用出错了')
                    console.error(e.message)
                    resolve('休息一下吧')
                })
            })
        }
    },
    {
        keywords: ['网易云热评', '热评'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                axios.get('https://v2.alapi.cn/api/comment?token=aCPgupefjrIOitsa').then(res => {
                        if (res.data.code !== 200) {
                            console.log('网易云热评接口调用出错')
                            console.log(res.data)
                            resolve("休息一下吧")
                            return
                        }
                        let msg = `${res.data.data.comment_content}\n\n
                                        —— 网易云音乐热评《${res.data.data.title}》`
                        resolve(msg)
                    }
                ).catch(e => {
                    console.error('网易云热评接口调用出错了')
                    console.error(e.message)
                    resolve('休息一下吧')
                })
            })
        }
    },
    {
        keywords: ['开启聊天'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                let fucList = ['签到', '签到榜', '猜拳, "例如猜拳石头"', '个人中心',
                    '一言', '成语接龙', '倒计时, 例如"高考倒计时"', '智能回复']
                let fucListStr = fucList.map((v, i) => `${i + 1}. ${v}`).join('\n')

                let userId = data.sender.user_id
                if (!Auth.isGlobalChatOpen()) {
                    resolve('管理员未开启聊天模式')
                    return
                }
                if (Auth.isUserChatOpen(userId)) {
                    let prefix = '已经在聊天模式中咯~\n支持:\n'
                    resolve(prefix + fucListStr)
                } else {
                    Auth.setUserChatState(userId, 'lc')
                    let prefix = '开启聊天模式成功~\n支持:\n'
                    resolve(prefix + fucListStr)
                }
            })
        }
    },
    {
        keywords: ['关闭聊天'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                let userId = data.sender.user_id
                if (!Auth.isGlobalChatOpen(userId)) {
                    resolve("已经关闭了哦")
                } else {
                    Auth.setUserChatState(userId)
                    resolve("关闭聊天模式成功~")
                }
            })
        }
    },
    {
        keywords: ['语音测试'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                let records = [
                    './resources/2.0.0.flac',
                    'https://tts.youdao.com/fanyivoice?le=zh&keyfrom=speaker-target&word=你好啊',
                    'https://tts.youdao.com/fanyivoice?le=zh&keyfrom=speaker-target&word=欢迎加入乐程',
                    'https://tts.youdao.com/fanyivoice?le=zh&keyfrom=speaker-target&word=好好学习, 天天向上',
                ]
                resolve(segment.record(records.randomOne()))
            })
        }
    }, {
        keywords: ['开启语音'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                if (!Auth.isGlobalVoiceOpen()) {
                    resolve('管理员未开启语音模式')
                    return
                }
                let userId = data.sender.user_id
                if (Auth.isUserVoiceOpen(userId)) {
                    resolve('已经在语音模式中了哦~')
                } else {
                    Auth.setUserChatState(userId, 'lc')
                    Auth.setUserVoiceState(userId, 'lc')
                    resolve('开启语音模式成功~')
                }
            })
        }
    },
    {
        keywords: ['关闭语音'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                let userId = data.sender.user_id
                if (!Auth.isUserVoiceOpen(userId)) {
                    resolve("已经关闭了哦")
                } else {
                    Auth.setUserVoiceState(userId)
                    resolve("关闭语音模式成功~")
                }
            })
        }
    },
    {
        keywords: ['历史上今天', '历史上的今天', '历史今天', '历史的今天'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                axios.get('https://api.asilu.com/today').then(res => {
                    if (res.data.code !== 200) {
                        console.error(`历史上的今天接口出错了 | ${res.data}`)
                        resolve('休息一下吧')
                        return
                    }
                    let msgList = [`${new Date().toLocaleDateString()}`]
                    res.data.data.forEach(e => {
                        if (e.year >= 0) {
                            msgList.push(`${e.year}年: ${e.title}`)
                        } else {
                            msgList.push(`公元前${Math.abs(e.year)}年: ${e.title}`)
                        }
                    })
                    resolve(msgList.join('\n\n'))
                }).catch(e => {
                    console.error(`历史上的今天接口出错了 | ${e.message}`)
                    resolve('休息一下吧')
                })
            })
        }
    },
    {
        keywords: ['set'],
        callback: (data, bot) => {
            return new Promise(resolve => {
                let userId = data.sender.user_id
                if (!Auth.isAdmin(userId)) {
                    resolve('没有权限哩!')
                    return
                }
                let msg = Utils.getMsgItemByType(data.message, 'text')
                    .data.text.replaceAll('  ', ' ').trim()

                // match
                const pattern = /^set [a-zA-z]+ \d+/
                if (!pattern.test(msg)) {
                    resolve('指令格式错误')
                    return;
                }
                let args = msg.split(' ')
                if (!['chat', 'voice'].includes(args[1])) {
                    resolve('设置错误, 没有该项')
                    return
                } else {
                    Auth.setGlobalState(args[1], args[2])
                }
                resolve(`设置${args[1]}成功!`)
            })
        }
    },
    {   // 这个一定要放在最后面，之前所有关键字均为命中则进入本项
        handle_type: 'default',
        callback: function (data, bot) {
            let userId = data.sender.user_id

            // 没有开启聊天模式
            if (!Auth.isUserChatOpen(userId)) {
                return new Promise((resolve, reject) => {
                    let replyMsg = ['(oωo)喵?', '干嘛?', '怎么了?', '在的', '嗯哼?', '@我干嘛?', '[CQ:face,id=307,text=/喵喵]', '2333~', '咕-咕-咕-',
                        '[CQ:image,file=812dea6ecfaa3b293ee1a3028209354741519-417-114.gif,url=https://c2cpicdw.qpic.cn/offpic_new/2779066456//2779066456-1883383011-812DEA6ECFAA3B293EE1A30282093547/0?term=2]',
                        '[CQ:image,file=53f96a7a6539652caf0486c065b5069c280114-240-240.gif,url=https://gchat.qpic.cn/gchatpic_new/2779066456/742958634-2353126009-53F96A7A6539652CAF0486C065B5069C/0?term=2]',
                        '有时候和我聊天的人太多了,我只能选择回复一部分', '虽然还不知道你想要说什么,但我还是得提醒一下有个东西叫百度', '嗨嗨害', '哪里又需要我了？', '怎么,是打算V我50了吗？',
                        '有时候,有的话题我建议找我私聊比较好', '(。w。)', '如果有什么建议，可以反馈给乐程的开发者们',
                        '[CQ:image,file=67ad61b9c39ee80d2ce868144ddad15f86909-1080-1080.jpg,url=https://gchat.qpic.cn/gchatpic_new/2779066456/742958634-2401112147-67AD61B9C39EE80D2CE868144DDAD15F/0?term=2]',
                        '[CQ:image,file=c78d9d5c7582d8784d0eef74ae1c8b9619967-240-240.jpg,url=https://gchat.qpic.cn/gchatpic_new/2779066456/742958634-2607997725-C78D9D5C7582D8784D0EEF74AE1C8B96/0?term=2]',
                        '[CQ:image,file=4963658e6bad33e4feee8c2bd7296fa2499244-240-148.gif,url=https://gchat.qpic.cn/gchatpic_new/2779066456/742958634-3029959254-4963658E6BAD33E4FEEE8C2BD7296FA2/0?term=2]',
                        '[CQ:image,file=a51555ea7b750eb4d8064ffebbe17e1d82099-1080-1128.jpg,url=https://gchat.qpic.cn/gchatpic_new/2779066456/742958634-2519447466-A51555EA7B750EB4D8064FFEBBE17E1D/0?term=2]',
                        '不懂，我是人工智障'
                    ].randomOne()
                    resolve(replyMsg)
                })
            }

            // 开启聊天模式
            return new Promise(resolve => {
                let msgList = data.message
                for (let msg of msgList) {
                    if (msg.type === 'text') {
                        let playLoad = mlyai.getPlayLoad(2, msg, data);
                        // console.log(playLoad)
                        mlyai.chat(playLoad).then(replies => {
                            resolve(Utils.convertToElems(replies, Auth.isUserVoiceOpen(userId)))
                        })
                        return
                    }
                }
            })
        }
    }

]

module.exports = messageGroupConfig

