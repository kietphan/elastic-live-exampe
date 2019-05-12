import adapter from 'webrtc-adapter';
import ELive from '@elasticlive/sdk'
var $ = require("jquery");

const config = {
  credential: {
    serviceId: "simpleapp",
    key: "27f8ca5ee273153d9a9c5944c766fa097d2e16de4dda425a"
  },
  sdk: {
    logLevel: "INFO",
    country: "KR"
    // mode: "dev"
    // audioType: 'music'
  },
  view: {
    local: "localVideo",
    remote: "remoteVideo"
  }
};
const live = new ELive(config);
let call_id = location.hash.split('#')[1];
console.log("call id", call_id);
if(call_id){
  document.querySelector("#callid").disabled = false;
  document.querySelector("#switchCamera").disabled = false;
  document.querySelector("#close").disabled = false;
  console.log("herererer")
  live.call(call_id);
}
const msgbox = document.querySelector("#messagebox");;
document.querySelector("#call").addEventListener("click", evt => {
  document.querySelector("#callid").disabled = false;
  document.querySelector("#switchCamera").disabled = false;
  document.querySelector("#close").disabled = false;
  let callid = document.querySelector("#callid").value || "demo";
  callid = "room_" + callid;
  live.call(callid);
  let chatUrl = `${window.location.href}#${callid}`
  msgbox.innerHTML = `Please send User this link: <a href='${chatUrl}' target='__new'>${chatUrl}</a>`;
  evt.preventDefault();
});

$("#switchCamera").click(()=>{
  live.switchCamera();
  evt.preventDefault();
})

$("#close").click(()=>{
  live.close();
  document.querySelector("#callid").disabled = true;
  document.querySelector("#switchCamera").disabled = true;
  document.querySelector("#close").disabled = true;
  document.querySelector("#message-content").disabled = true;
})

$("#sendMessage").click(()=>{
  let content = $("#message-content").val();
  let html = `<li class="align-left">
      <label for="chkbox1" class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect">
        <span class="mdl-checkbox__label">${content}</span>
      </label>
    </li>`;
    $('#inbox-message').append(html);
  live.sendMessage(content);
})


live.on("onMessage", msg => {
  let htmlRight = `<li class="align-right">
      <label for="chkbox1" class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect">
        <span class="mdl-checkbox__label">${msg}</span>
      </label>
    </li>`;
    $('#inbox-message').append(htmlRight);
});


live.on("onComplete", msg => {
  console.log("oncomplete is called");
  // msgbox.innerHTML = "Talk and fun time~";
  // document.querySelector("#callid").disabled = false;
  // document.querySelector("#switchCamera").disabled = false;
  // document.querySelector("#close").disabled = false;
  // document.querySelector("#captureScreen").disabled = false;
  // document.querySelector("#chatbox").disabled = false;
});