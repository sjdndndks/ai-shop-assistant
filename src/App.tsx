import {useState} from 'react'
import defauleImg from './defaultImg.jpg'
import pigImg from './pig.jpg'

//消息定义
interface Message {
  id: number
  text: string 
  isUser: boolean
  product?: Product     //有？代表这个属性是可选的
}

//商品定义
interface Product{
  id: string
  name: string
  price: number
  imageUrl: string
}

function ProductCarf({product}:{product:Product}){
  return(
    <div
      style={{
        border:'1px solid #eee',
        width:'200px',
        padding:'12px',
        borderRadius:'12px',
        backgroundColor:'white',
        boxShadow:'0 4px 6px rgba(0,0,0,0.05)'
      }}
    >
      {/* 渲染图片 */}
      <img 
        src={product.imageUrl}
        alt={product.name}
        style={
          {
            width:'120px',
            height:'120px',
            objectFit:'cover',
            borderRadius:'6px'
          }
        }
        onError={(e)=>{
          e.currentTarget.onerror = null
          e.currentTarget.src = pigImg
        }}
      >
      </img>
      {/* 渲染名字 */}
      <h3 
        style={
          {fontSize:'16px',
            margin: '10px 0 5px 0',
            color:'grey'
          }
        }
      >
        {product.name}
      </h3>
      {/* 渲染价格 */}
      <p 
        style={
          {color:'#ff4d4f', 
          fontSize:'18px', 
          fontWeight:'bold',
          margin:'0 0 10px 0'}}>
        ¥{product.price}
      </p>
      <button
        style={
          {
            width:'100%',
            padding:'9px',
            backgroundColor:'#ff4d4f',
            color:'white',
            border:'none',
            borderRadius:'80px',
            fontWeight:'bold',
            boxShadow:'0 4px 8px rgba(0,0,0,0.2)'
          }
        }
      >立即购买</button>
    </div>
  )
}

function App(){
  const [messages, setMessages] = useState <Message[]> ([])
  const [input, setInput] = useState('')
  const [status,setStatus] = useState< 'idle' | 'loading' | 'error'>('idle')
  const [errorMessage,setErrorMessage] = useState('') 


  const fakeApple: Product = {
    id: 'p1',
    name: 'AirPods Pro 降噪耳机',
    price: 1899,
    imageUrl: 'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/MTJV3?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1694014871985'
  }

  //发送消息 （函数名写错了，就这样吧
  const setMessage = async () => {
    setErrorMessage('')
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
    
    //控制器
    const controller = new AbortController()
    //定时器,时间一到就中断fetch请求，单位ms
    const timeOutId =
    setTimeout(()=>{
      controller.abort()
    },30000)
    try{
      setStatus('loading')
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_KEY}`
          },
          body: JSON.stringify({
            model: 'openrouter/free',
            messages: [
              {
                role:'system',
                content:`你是一个专业的电商助手。
                1.如果用户只是想跟你打招呼或闲聊，请用简短友好的纯文本回复。
                2.如果用户想买东西，找商品，你【绝对不能】回复普通的文字，你【必须】只返回一个合法 JSON 字符串！绝对不能包含 markdown 标记 （比如\`\`\` json），直接输出带大括号的 JSON。
                  JSON的格式必须严格如下：
                  {
                    "type": "product",
                    "data": {
                        "id": "随机生成一个不重复的字符串",
                        "name": "真实的商品名称",
                        "price": 一个真实的数字价格,
                        "imageUrl": "找一个真实的商品图片网址，如果没有就用 https://via.placeholder.com/200"
                    }
                  }
                `
              },
              { role: 'user', content: input }]
          }),
          //fetch连接控制器
          signal: controller.signal
        }
      )
      //等到了回答，取消炸弹
      clearTimeout(timeOutId)

      if(!response.ok){
        const errorData = await response.json()
        throw new Error(`API Error ${response.status}: ${errorData.error?.message || '未知参数错误'}`)
      }
    
      //3.解析回复
      //response不能直接看，需要用.json()拆开信封,把字符串转回json
      // 3.1模拟AI回复（先用假数据跑通流程）
      //const aiReply = '你好！我是AI购物助手，有什么可以帮你的？'
      const data = await response.json()
      setStatus('idle')
      if(data.error) {
        throw new Error(`API 内部报错啦：${data.error.message}`)
      }
      if(!data.choices || data.choices.length === 0) {
        throw new Error("API 返回了奇怪数据，找不到choices")
      }
      const aiReply = data.choices[0].message.content
      const aiMessage: Message = {
        id: Date.now() +1 ,
        text: aiReply,
        isUser: false
      }

      try {
        const parsedData = JSON.parse(aiReply)
        if(parsedData.type === 'product') {
          aiMessage.text = "为您找到以下商品"
          aiMessage.product = parsedData.data
        }
      } catch (error) {
        //报错说明这不是JSON，只是普通文本，不需要额外操作
      }

    //4.把回复加入到列表
    setMessages (mes => [...mes,aiMessage])
    setStatus('idle')
  }
  //报错
  catch(err){
    setStatus('error')
    if(err instanceof Error){
      if (err.name === 'AbortError'){
        setErrorMessage('请求超时')
      }else{
        setErrorMessage(err.message)
      }
    }else{
      setErrorMessage('未知错误')
    }
  }
  finally{
    clearTimeout(timeOutId)
  }
}

  return (
    <>
      {/* 最外层 霸占整个浏览器 */}
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        margin: '0 auto',
        backgroundColor: 'white',
      }}>
        {/* 顶部标题区 */}
        <div style={{
          padding: '16px',
          textAlign: 'center',
          borderBottom: '1px solid #e5e5ea',
          fontWeight: 'bold',
          fontSize: '18px',
          backgroundColor: '#f6f6f8'
        }}>AI 购物助手</div>
        {/* <ProductCarf product={fakeApple} /> */}

        {/* 聊天记录区 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#ffffff'
        }}>
          {/* 消息列表,内层约束容器 */}
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            display:'flex',
            flexDirection:'column',
            gap:'16px',
            padding: '10px'
            }}>
            {messages.map(
              meg => (
                <div 
                  key={meg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: meg.isUser? 'flex-end' : 'flex-start'
                  }}
                >
                  {/* 气泡 */}
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '10px 16px',
                      fontSize: '16px',
                      lineHeight: '1.4',
                      //苹果字体
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, san-serif',
                      fontWeight: '400',
                      //苹果配色
                      backgroundColor: meg.isUser? '#007aff' : '#e9e9eb',
                      color: meg.isUser? 'white' :'black',
                      // 气泡形状
                      borderRadius: meg.isUser? '18px 18px 4px 18px' : '18px 18px 18px 4px'
                    }}
                  >
                  {meg.text}
                  </div>
                  {/* 商品卡片 */}
                  {meg.product && 
                  (<div style={{marginTop:'10px'}}>
                    <ProductCarf product={meg.product} />
                  </div>)}
                </div>
              )
            )}

            {/* 状态提示 */}
            {status==='loading' && <div>正在思考...</div>}
            {status==='error' &&  <div style={{color:'red'}}>请求失败:{errorMessage}</div>   }
            {status==='idle' && messages.length === 0 && <div style={{
              fontSize: '14px', 
              textAlign: 'center', 
              color: '#999',
              marginTop: '40px',
              }}>有什么能帮您的？</div>}
          </div>
        </div>

        {/* 底部输入区域 */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor:'#f6f6f8',
            borderTop: '1px solid #e5e5ea',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* 底部长条框 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            width: '100%',
            maxWidth: '800px'
          }}>
            <input 

              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder='iMessage信息...' 
              onKeyDown={ (e)=> {
                if(e.key === 'Enter' && status != 'loading') {
                  setMessage()
                }
              }}

              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: '15px',
                borderRadius: '20px',
                border: '1px solid #d1d1d6',
                outline: 'none',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
              }}
              />
            <button 
              onClick={setMessage} 
              disabled={status==='loading'}
              style={{
                backgroundColor: status==='loading'? '#A0CFFF' : '#007aff',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: status === 'loading'? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize:'18px',
                flexShrink: 0
              }}
              >
                ↑
              </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default App