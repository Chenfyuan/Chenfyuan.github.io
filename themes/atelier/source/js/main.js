(function () {
  var clock = document.querySelector("[data-clock]");
  if (clock) {
    var fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Singapore"
    });
    var tick = function () {
      clock.textContent = fmt.format(new Date());
    };
    tick();
    window.setInterval(tick, 1000);
  }

  var nav = document.querySelector("[data-nav]");
  var indicator = document.querySelector("[data-nav-indicator]");
  var placeIndicator = function () {
    if (!nav || !indicator) return;
    var current = nav.querySelector(".nav-link.is-current");
    if (!current) {
      indicator.style.opacity = "0";
      return;
    }
    var navRect = nav.getBoundingClientRect();
    var rect = current.getBoundingClientRect();
    indicator.style.opacity = "1";
    indicator.style.width = rect.width + "px";
    indicator.style.height = rect.height + "px";
    indicator.style.transform = "translate(" + (rect.left - navRect.left) + "px, " + (rect.top - navRect.top) + "px)";
  };
  placeIndicator();
  window.addEventListener("resize", placeIndicator);

  var toggle = document.querySelector("[data-nav-toggle]");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      window.requestAnimationFrame(placeIndicator);
    });
  }

  var bar = document.querySelector("[data-pageloading]");
  if (bar) {
    window.requestAnimationFrame(function () {
      bar.classList.add("is-on");
      window.setTimeout(function () {
        bar.classList.add("is-done");
        window.setTimeout(function () {
          bar.classList.add("is-hidden");
        }, 180);
      }, 220);
    });
  }
})();
