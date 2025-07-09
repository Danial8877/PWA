if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("/service-worker.js")
    .then(r => {
      console.log("SW SUCCESS:", r.scope);
      r.onupdatefound = () => console.log("SW SUCCESS VERSION");
    })
    .catch(console.error);

let d;
window.onbeforeinstallprompt = e => {
  e.preventDefault();
  d = e;
  const b = document.querySelector("#btn-pwa");
  if (!b) return;
  b.style.display = "block";
  b.onclick = () => {
    d.prompt();
    d.userChoice.then(c => {
      console.log(c.outcome === "accepted" ? "PWA SUCCESS" : "PWA ERROR");
      d = null;
    });
  };
};

window.onappinstalled = () => (console.log("PWA SUCCESS"), d = null);