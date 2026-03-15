import {useState} from 'react'
interface Message {
  id: number
  text: string 
  isUser: boolean
}

function App(){
  const [messages, setMessages] = useState <Message[]> ([])
  const [input, setInput] = useState('')

  //发送消息 （函数名写错了，就这样吧
  const setMessage = async () => {

    //1.把用户消息加入列表
    // 如果输入为空，则返回
    if(!input.trim()) return

    //新消息的赋值
    const newMessage:Message = {
      id: Date.now(),
      text: input,
      isUser: true
    }

    setMessages(mes => [...mes, newMessage])
    setInput('')

    //2.调用api
    //response就是服务器寄回来的信
    // const response = await fetch(
    //   'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAg1fCpE5N68AyUMfVOQOFvyXV9gbGB6I4',
    //   {
    //     method:'POST',
    //     headers:{
    //       'Content-Type':'application/json',
    //     },
    //     body: JSON.stringify({
    //       contents: [{
    //         parts: [{ text: input }]
    //       }]
    //     })
    //   }
    // )
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: 'openrouter/hunter-alpha',
          messages: [{ role: 'user', content: input }]
        })
      }
    )

    
    //3.解析回复
    //response不能直接看，需要用.json()拆开信封,把字符串转回json
    //const data = await response.json()
    //const aiReply = data.candidates[0].content.parts[0].text
    // 3.1模拟AI回复（先用假数据跑通流程）
    //const aiReply = '你好！我是AI购物助手，有什么可以帮你的？'
    const data = await response.json()
    const aiReply = data.choices[0].message.content
    const aiMessage: Message = {
      id: Date.now() +1 ,
      text: aiReply,
      isUser: false
    }

    //4.把回复加入到列表
    setMessages (mes => [...mes,aiMessage])
  }

  return (
    <>
      <div>
        <h1>AI 购物助手</h1>
        <div>
          {messages.map(
            meg => (
              <div key={meg.id}>
                {meg.text}
              </div>
            )
          )}
        </div>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder='输入消息' />
        <button onClick={setMessage} >发送</button>
      </div>
    </>
  )
}

export default App