/* eslint-disable @typescript-eslint/no-explicit-any */
import GM_config from "./gm_config";

(function () {
  "use strict";

  const urlRegs = [
    /\/comic\/[0-9]+\/[0-9]+\.html/,
    /\/pchapter\//
  ]
  let urlFlag = false
  for (let index = 0; index < urlRegs.length; index++) {
    const reg = urlRegs[index];
    if (location.href.match(reg)) {
      urlFlag = true
    }
  }
  if (!urlFlag) {
    return
  }

  console.log(1)

  // if (!location.href.match(/\/comic\/[0-9]+\/[0-9]+\.html/)) {
  //   return
  // }

  let queueLength = 0;
  let stop = true;
  let scale = 4;

  const gmc: any = new GM_config({
    id: "MyConfig", // The id used for this instance of GM_config
    title: "设置AI缩放", // Panel Title
    // Fields object
    fields: {
      // This is the id of the field
      scale: {
        label: "质量", // Appears next to field
        title: "质量越高速度越慢。默认“4”",
        type: "select", // Makes this setting a text field
        options: ["2", "3", "4"],
        default: "4", // Default value if user doesn't change it
      },
    },
    events: {
      save: function () {
        gmc.close();
      },
    },
  });

  GM_addStyle("#MyConfig {width:auto!important;height:auto!important;}");

  function waitImg(img: HTMLImageElement, fun: (...args: any[]) => void) {
    setTimeout(() => {
      if (img && img.complete) {
        fun(img);
      } else {
        waitImg(img, fun);
      }
    }, 100);
  }

  function refreshStateBar() {
    if (queueLength === 0 && stop === false) {
      stateBar.style.display = "none";
    } else {
      stateBar.style.display = "block";
    }
    stateBar.innerHTML = `正在处理 ${queueLength} 张图片`;
  }

  function showErrorStateBar() {
    stateBar.style.display = "block";

    stateBar.innerHTML =
      '<span class="msg">本机后台AI画质修复程序未运行，请检查后台程序状态。 </span>';
    const linkArea = document.createElement("span");
    linkArea.innerHTML =
      '<a href="https://greasyfork.org/zh-CN/scripts/483769-%E6%BC%AB%E7%94%BB%E7%BD%91%E7%AB%99%E7%94%BB%E8%B4%A8ai%E4%BF%AE%E5%A4%8D" style="color:blue" target="_blank">说明文档 <a/>';
    stateBar.appendChild(linkArea);
    const launchBackAppLink = document.createElement("a");
    launchBackAppLink.innerHTML = "尝试调起应用 ";
    launchBackAppLink.href = "mangaAIRepairerBackend:a";
    launchBackAppLink.style.color = "blue";
    launchBackAppLink.addEventListener("click", function () {
      stateBar.querySelector(".msg")!.innerHTML =
        "如果应用未启动则需安装应用。详情见文档。 ";
    });
    linkArea.appendChild(launchBackAppLink);
  }

  function handleImg(img: HTMLImageElement) {
    if (img.dataset.handled) {
      return;
    }
    queueLength++;
    refreshStateBar();

    img.style.width = `${img.offsetWidth}px`;

    img.dataset.handled = "true";
    const host = window.location.origin + "/";
    GM_xmlhttpRequest({
      method: "GET",
      url: img.src,
      headers: { referer: host },
      responseType: "blob",
      onload: function (r) {
        const blob = r.response;
        const oFileReader = new FileReader();
        oFileReader.onloadend = function () {
          const base64 = oFileReader.result;
          GM_xmlhttpRequest({
            method: "POST",
            url: "http://localhost:31485/handle_img",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
            },
            data: JSON.stringify({ data: base64, level: scale, scale }),
            // data: `{"data":"${base64}"}`,
            onload: function (r) {
              img.src = "data:image/jpg;base64," + r.response;
              queueLength--;
              refreshStateBar();
            },
            onerror: function () {
              stop = true;
              queueLength--;
              showErrorStateBar();

              delete img.dataset.handled;
            },
          });
        };
        oFileReader.readAsDataURL(blob);
      },
    });
  }

  function checkAlive() {
    return new Promise<void>((res, rej) => {
      try {
        GM_xmlhttpRequest({
          method: "GET",
          url: "http://localhost:31485",
          onload: function () {
            res();
          },
          onerror: function () {
            rej();
          },
        });
      } catch (error) {
        console.log(error)
      }
    });
  }

  const stateBar = document.createElement("div");
  stateBar.style.position = "fixed";
  stateBar.style.border = "1px solid #333";
  stateBar.style.padding = "8px";
  stateBar.style.backgroundColor = "#fff";
  stateBar.style.fontSize = "14px";
  stateBar.style.display = "none";
  stateBar.style.left = "20px";
  stateBar.style.bottom = "40px";

  document.body.appendChild(stateBar);

  const toolBar = document.createElement("div");
  toolBar.innerHTML = `
    
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
      <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
    </svg>
    
      `;

  toolBar.style.padding = "20px";
  toolBar.style.cursor = "pointer";
  toolBar.style.opacity = "0.5";
  toolBar.style.display = "none";
  toolBar.style.marginLeft = "30px";
  toolBar.style.marginTop = "150px";

  const hover = document.createElement("div");
  hover.style.width = "200px";
  hover.style.height = "300px";
  hover.style.position = "fixed";
  hover.style.left = "0";
  hover.style.bottom = "0";
  hover.addEventListener("mousemove", function () {
    toolBar.style.display = "block";
  });
  hover.addEventListener("mouseleave", function () {
    toolBar.style.display = "none";
  });
  document.body.appendChild(hover);
  hover.appendChild(toolBar);

  toolBar.addEventListener("click", () => {
    gmc.open();
  });

  gmc.onInit = () => {
    scale = gmc.fields.scale.value;
    checkAlive()
      .then(() => {
        stop = false;
      })
      .catch(() => {
        showErrorStateBar();
      });

    setInterval(() => {
      if (!stop) {
        const allImg = Array.from(document.getElementsByTagName("img"));
        allImg.forEach((img) => {

          if (img.offsetWidth >= 500 && !img.src.match(/.*\.gif/) && !img.dataset.handled) {
            waitImg(img, handleImg);
            // console.log(img)
          }
        });
      }
    }, 1000);

    // 检测后台是否存活
    setInterval(() => {
      checkAlive()
        .then(() => {
          stop = false;
        })
        .catch(() => {
          stop = true;
          showErrorStateBar();

        });
    }, 1000);
  };
})();
