/**
 * saltnotes.blog Reading Desk receiver.
 * Loaded only as a first-party script from Occasion OS.
 * Fail closed: no PII, no off-site reading links, no invented seats.
 */
(function () {
  if (!/\/reading-desk\/?$/.test(location.pathname)) return;

  var HOUSE = "https://saltnotes.blog";
  var PROHIBITED = {
    guestNames: 1,
    emailAddresses: 1,
    medicalHistory: 1,
    exactAllergySafetyConclusion: 1,
    paymentData: 1,
    currentPriceGuarantees: 1,
  };

  function tokenFromLocation() {
    var hash = (location.hash || "").replace(/^#/, "");
    var params = new URLSearchParams(hash);
    if (params.get("sc")) return params.get("sc");
    return new URLSearchParams(location.search).get("sc");
  }

  function fromBase64Url(s) {
    var pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    var bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function walk(value, found) {
    if (!value || typeof value !== "object") return;
    Object.keys(value).forEach(function (key) {
      if (PROHIBITED[key]) found.push(key);
      walk(value[key], found);
    });
  }

  function valid(payload) {
    if (!payload || payload.v !== "1.0.0") return false;
    if (!payload.label || !payload.guests || !payload.reading || !payload.reading.length) return false;
    var found = [];
    walk(payload, found);
    if (found.length) return false;
    if (payload.seatingKnown === false && payload.seatingCount != null) return false;
    for (var i = 0; i < payload.reading.length; i++) {
      if (String(payload.reading[i].url || "").indexOf(HOUSE + "/") !== 0) return false;
    }
    return true;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function kindLabel(kind) {
    return (
      { house: "Desk", hosting: "Hosting", recipe: "Recipe", drink: "Drink", essay: "Essay", menu: "Menu" }[kind] ||
      "Desk"
    );
  }

  var token = tokenFromLocation();
  if (!token || token.slice(0, 2) !== "j.") return;

  try {
    var payload = JSON.parse(fromBase64Url(token.slice(2)));
    if (!valid(payload)) return;
    var mount = document.getElementById("sc-desk-mount");
    var empty = document.getElementById("sc-desk-empty");
    if (!mount) return;

    var dishes = (payload.dishes || [])
      .map(function (d) {
        return "<li>" + esc((d.course ? d.course + " · " : "") + d.name) + "</li>";
      })
      .join("");

    var reading = payload.reading
      .map(function (p) {
        return (
          "<li><a href=\"" +
          esc(p.url) +
          "\">" +
          esc(p.title) +
          "</a> <span class=\"sc-kind\">" +
          esc(kindLabel(p.kind)) +
          "</span></li>"
        );
      })
      .join("");

    var seats =
      payload.seatingKnown === false
        ? "Seats were not declared. This desk will not invent chairs."
        : esc(String(payload.guests)) + " guests";

    var reopen = payload.reopen
      ? "<p><a href=\"" + esc(payload.reopen) + "\"><strong>Reopen this plan →</strong></a></p>"
      : "<p><a href=\"https://occasion.saltnotes.blog/\"><strong>Reopen Occasion OS →</strong></a></p>";

    mount.innerHTML =
      "<section class=\"sc-intro sc-desk-brief\">" +
      "<p class=\"sc-eyebrow\">BRIEF FROM " +
      esc(String(payload.from || "plan").toUpperCase()) +
      "</p><h2>" +
      esc(payload.label) +
      "</h2>" +
      (payload.thesis ? "<p>" + esc(payload.thesis) + "</p>" : "") +
      "<p>" +
      seats +
      "</p>" +
      (dishes ? "<ul class=\"sc-desk-dishes\">" + dishes + "</ul>" : "") +
      reopen +
      "</section><section class=\"sc-body\"><h2>What to read next</h2><ul class=\"sc-desk-reading\">" +
      reading +
      "</ul><p>These are first-party pieces on this site, chosen because they share a job with the menu that arrived — not because an algorithm likes them.</p></section>";

    mount.hidden = false;
    if (empty) empty.hidden = true;
  } catch (e) {
    /* fail closed */
  }
})();
