(function () {
  "use strict";

  var DATA_PATH = "data/project-state.json";

  function fetchState() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", DATA_PATH, true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          render(JSON.parse(xhr.responseText));
        } catch (e) {
          showError("Failed to parse project-state.json");
        }
      } else {
        showError("Could not load project-state.json (HTTP " + xhr.status + ")");
      }
    };
    xhr.onerror = function () {
      showError("Could not load project-state.json — make sure data/project-state.json exists.");
    };
    xhr.send();
  }

  function render(state) {
    var p = state.project || {};
    var h = state.health || {};
    var s = state.stats || {};

    setText("project-name", p.name || "Untitled Project");
    setText("project-domain", p.domain || "");
    setText("project-phase", p.phase || "init");

    // Health cards
    var grid = document.getElementById("health-grid");
    grid.innerHTML = "";
    var gates = [
      { label: "Performance", val: h.performance },
      { label: "Quality", val: h.quality },
      { label: "Security", val: h.security }
    ];
    gates.forEach(function (g) {
      var v = g.val || 0;
      var cls = v >= 7 ? "high" : v >= 4 ? "mid" : "low";
      var card = document.createElement("div");
      card.className = "health-card";
      card.innerHTML =
        '<div class="label">' + esc(g.label) + "</div>" +
        '<div class="score ' + cls + '">' + v + "/10</div>";
      grid.appendChild(card);
    });

    // Stats
    var strip = document.getElementById("stats-strip");
    strip.innerHTML = "";
    var statItems = [
      { num: s.features || 0, lbl: "Features" },
      { num: s.modules || 0, lbl: "Modules" },
      { num: s.skills || 0, lbl: "Skills" }
    ];
    statItems.forEach(function (si) {
      var d = document.createElement("div");
      d.className = "stat";
      d.innerHTML = '<div class="num">' + si.num + '</div><div class="lbl">' + esc(si.lbl) + "</div>";
      strip.appendChild(d);
    });

    // Stack tags
    var tags = document.getElementById("stack-tags");
    tags.innerHTML = "";
    (p.stack || []).forEach(function (t) {
      var span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      tags.appendChild(span);
    });

    // Modules
    var ml = document.getElementById("modules-list");
    ml.innerHTML = "";
    (state.modules || []).forEach(function (m) {
      var d = document.createElement("div");
      d.className = "module-item";
      d.innerHTML = '<span class="name">' + esc(m.name || "") + '</span> <span class="purpose">' + esc(m.purpose || "") + "</span>";
      ml.appendChild(d);
    });

    // Changelog
    var cl = document.getElementById("changelog-list");
    cl.innerHTML = "";
    (state.changelog || []).forEach(function (entry) {
      var li = document.createElement("li");
      li.textContent = entry;
      cl.appendChild(li);
    });

    // Blockers
    var bl = document.getElementById("blockers-list");
    var nb = document.getElementById("no-blockers");
    bl.innerHTML = "";
    var blockers = state.blockers || [];
    if (blockers.length === 0) {
      nb.style.display = "block";
    } else {
      nb.style.display = "none";
      blockers.forEach(function (b) {
        var li = document.createElement("li");
        li.textContent = b;
        bl.appendChild(li);
      });
    }
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function showError(msg) {
    document.body.innerHTML =
      '<div style="text-align:center;margin-top:4rem;color:#f87171;">' +
      '<h2>Dashboard Error</h2><p>' + msg + "</p></div>";
  }

  fetchState();
})();
