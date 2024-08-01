async function chat_api(userMessage, chat_history) {
  console.log("chat_api() called");

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    query: userMessage,
    enable_chat_history: true,
    chat_history: chat_history,
    facialExpression: "smile",
  });
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(
    "https://7097-2001-44c8-40b4-a22c-38c2-486-dc79-e06c.ngrok-free.app/ultimate_v1/chat",
    requestOptions
  );

  const result = await response.text();
  const data = JSON.parse(result);
  const data_formatted = chat_formatting(data);

  console.log(JSON.stringify(data_formatted));

  return JSON.stringify(data_formatted);
}
function chat_formatting(data) {
  console.log("chat_formatting() called");
  const jsonReturn = {
    choices: [
      {
        content_filter_results: {
          hate: {
            filtered: false,
            severity: "safe",
          },
          self_harm: {
            filtered: false,
            severity: "safe",
          },
          sexual: {
            filtered: false,
            severity: "safe",
          },
          violence: {
            filtered: false,
            severity: "safe",
          },
        },
        finish_reason: "stop",
        index: 0,
        logprobs: null,
        message: {
          content:
            '```json\n[\n    {\n        "text": "วันนี้ลองทานข้าวมันไก่กันไหมคะ? เป็นอาหารที่ทั้งอร่อยและทำง่ายเลยล่ะค่ะ",\n        "facialExpression": "smile",\n        "animation": "Talking_0"\n    },\n    {\n        "text": "หรือถ้าอยากลองอะไรใหม่ๆ สลัดผักกับไก่ย่างก็เป็นตัวเลือกที่ดีนะคะ ทั้งสดชื่นและมีประโยชน์ด้วยค่ะ",\n        "facialExpression": "smile",\n        "animation": "Talking_1"\n    },\n    {\n        "text": "และอย่าลืมดื่มน้ำเยอะๆ นะคะ ช่วยให้ร่างกายสดชื่นและมีพลังในการทำงานค่ะ",\n        "facialExpression": "smile",\n        "animation": "Talking_2"\n    }\n]\n```',
          role: "assistant",
        },
      },
    ],
    created: 1715573903,
    id: "chatcmpl-9OHQlbRVpkH7A2VODThPQexsfCNwp",
    model: "gpt-4",
    object: "chat.completion",
    prompt_filter_results: [
      {
        prompt_index: 0,
        content_filter_results: {
          hate: {
            filtered: false,
            severity: "safe",
          },
          self_harm: {
            filtered: false,
            severity: "safe",
          },
          sexual: {
            filtered: false,
            severity: "safe",
          },
          violence: {
            filtered: false,
            severity: "safe",
          },
        },
      },
    ],
    system_fingerprint: "fp_2f57f81c11",
    usage: {
      completion_tokens: 311,
      prompt_tokens: 123,
      total_tokens: 434,
    },
  };
  let contentJson = [{
    text: data.output,
    facialExpression: 'smile',
    animation: 'Talking_0'
  }]
  jsonReturn.choices[0].message.content = "```json" + JSON.stringify(contentJson) + "```";
  return JSON.stringify(jsonReturn);
}

const chat_history = [
    {   
        "Human": "ขอรายละเอียดปัญหาหน่อย",
        "AI": "เมื่อตรวจสอบปัญหาจากการรายงานของท่าน ได้พบว่าปัญหาเกิดขึ้นกับชิ้นส่วน \"Turbine Housing B10\" ในสายการผลิต M147 โดยมีรายละเอียดปัญหาดังนี้:\n\n- เครื่อง CMM ได้ตรวจพบว่า position ของส่วนหนึ่งบนชิ้นส่วนได้สูงกว่าที่แบบวาด (drawing) กำหนดไว้\n- แบบวาดกำหนดให้ระยะต้องอยู่ที่ 14±0.01 mm แต่เมื่อทำการวัดจริงได้ค่าเป็น 14.017 mm\n- ปัญหานี้ต้องได้รับการแก้ไขอย่างเร่งด่วนเพื่อไม่ให้กระทบต่อผลผลิตรายวัน\n\nตามรายละเอียดปัญหานี้, ปัญหาถือว่ามีระดับความเสียหายที่ต่ำ (Minor) เนื่องจากค่าต่างไม่มากนักและยังสามารถแก้ไขได้โดยไม่กระทบต่อกระบวนการผลิตโดยรวมอย่างมากนัก\n\nการแก้ไขปัญหานี้คาดว่าจะใช้เวลาไม่มาก ขึ้นอยู่กับการประสานงานและการทำงานของทีมช่างซ่อม โดยประมาณอาจอยู่ในช่วง 1-2 ชั่วโมงหากไม่พบปัญหาเพิ่มเติม\n\nข้อเสนอแนะในการแก้ไขคือ ควรมีการตรวจสอบและปรับการตั้งค่าเครื่องจักรที่ใช้ในการผลิตชิ้นส่วนนี้ เพื่อให้ค่าที่วัดได้สอดคล้องกับตัวเลขที่กำหนดไว้ในแบบวาด\n\nหากท่านต้องการให้ดำเนินการส่งอีเมลแจ้งไปยังพนักงานที่เกี่ยวข้องในการแก้ไขปัญหานี้ กรุณาแจ้งให้ทราบเพิ่มเติมค่ะ"
    },
    {
        "Human": "ใครรับผิดชอบในงานนี้บ้าง",
        "AI": "สำหรับการแก้ไขปัญหาที่เกี่ยวข้องกับชิ้นส่วน \"Turbine Housing B10\" ในสายการผลิต M147 ที่เครื่อง CMM ตรวจพบว่า position ไม่ตรงตามที่แบบวาดกำหนด โดยมีรายละเอียดว่าแบบวาดกำหนดระยะไว้ที่ 14±0.01 mm แต่วัดจริงได้ 14.017 mm นั้น ควรถูกรับผิดชอบโดย:\n\n- ทีมช่างซ่อม ซึ่งประกอบไปด้วย:\n  - นายสมหมาย สุขใจ (DLG020143)\n  - นายสมศรี สมาน (DLG020144)\n  - นายสมศักดิ์ รัชชา (DLG020145)\n  - นายรพีย์ พัฒน์ (DLG020146)\n  - นายจณัตว์ สุวรรณวงศ์ (DLG020147)\n\n- ผู้ประสานงาน ที่สามารถช่วยในการประสานงานและติดตามผลการแก้ไขปัญหา ได้แก่:\n  - นางสาวสุดใจ ทดสอบ (DLG020148)\n  - นางสาวกลม รักษา (DLG020149)\n  - นางสาวไพลิน ขมิ้น (DLG020150)\n\nหากต้องการให้ดำเนินการส่งอีเมลแจ้งไปยังพนักงานที่เกี่ยวข้องเพื่อเร่งดำเนินการแก้ไขปัญหานี้ กรุณาแจ้งให้ทราบค่ะ"
    }
]
chat_api("แจ้งอีเมลไปหาคนที่เกี่ยวข้อง", chat_history)