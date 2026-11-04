/*
 * Route Runner core — pure logic, no DOM, no network.
 * Loaded by route/index.html as a classic script (window.RouteCore)
 * and by route/tests/*.js via require() — keep this file dependency-free.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.RouteCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ── line classification ────────────────────────────────────────── */

  var STREET_SUFFIX = /\b(BLVD|BOULEVARD|RD|ROAD|ST|STREET|AVE|AVENUE|DR|DRIVE|CT|COURT|CIR|CIRCLE|LN|LANE|WAY|PKWY|PARKWAY|HWY|HIGHWAY|PL|PLACE|EXPY|EXPRESSWAY|FWY|FREEWAY|TER|TERRACE|TRL|TRAIL|PIKE|PLAZA|SQ|SQUARE|LOOP)\b/i;
  var TIME_RANGE = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/;
  var CITY_STATE = /,\s*[A-Z][A-Za-z .'-]*,?\s*(CA|CALIFORNIA)\b/i;
  var HEADER_WORDS = /^(driver route sheet|route sheet|loomis|seq|seq\.?|time window|location name|address|addr|name|time|window|date|page \d+.*)$/i;

  function normLine(s) {
    return s
      .replace(/[–—−]/g, '-')
      .replace(/[ \t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isTimeWindow(s) { return TIME_RANGE.test(s) && s.replace(TIME_RANGE, '').trim().length <= 6; }
  function isBareSeq(s) { return /^\d{1,2}[.)]?$/.test(s); }
  function isHeader(s) { return HEADER_WORDS.test(s); }

  function isAddressStart(s) {
    if (!/^\d{2,6}(-\d+)?\s+\S/.test(s)) return false;
    return STREET_SUFFIX.test(s) || CITY_STATE.test(s);
  }

  // "SACRAMENTO, CA" / "CA" / "CA NORTH FLORIN" — continuation of a wrapped address.
  function isCityCont(s) {
    if (/^(CA|CALIFORNIA)\b/i.test(s) && s.length <= 40) return true;
    return /^[A-Z][A-Za-z .'-]*,\s*(CA|CALIFORNIA)\.?$/i.test(s);
  }

  function classify(line) {
    if (isHeader(line)) return 'header';
    if (isTimeWindow(line)) return 'time';
    if (isBareSeq(line)) return 'seq';
    if (isAddressStart(line)) return 'addr';
    if (isCityCont(line)) return 'citycont';
    return 'name';
  }

  /* Live Text splits time ranges across lines: "09:00-" + "16:30", or "09:00" + "-16:30". */
  function mergeTimeFragments(lines) {
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var cur = lines[i], nxt = lines[i + 1];
      if (nxt !== undefined) {
        if (/\d{1,2}:\d{2}\s*-$/.test(cur) && /^\d{1,2}:\d{2}/.test(nxt)) { out.push(cur + nxt); i++; continue; }
        if (/^\d{1,2}:\d{2}$/.test(cur) && /^-\s*\d{1,2}:\d{2}/.test(nxt)) { out.push(cur + nxt); i++; continue; }
      }
      out.push(cur);
    }
    return out;
  }

  function parseWindow(s) {
    var m = TIME_RANGE.exec(s);
    if (!m) return null;
    var start = (+m[1]) * 60 + (+m[2]);
    var end = (+m[3]) * 60 + (+m[4]);
    return { start: start, end: end, raw: m[1] + ':' + m[2] + '-' + m[3] + ':' + m[4] };
  }

  /* ── stop assembly ──────────────────────────────────────────────── */

  var nextId = 1;
  function newStop() {
    return { id: 's' + (nextId++), seq: null, name: '', note: '', address: '', window: null };
  }

  function finalize(stop, stops, unparsed) {
    var hasContent = stop.name || stop.address || stop.seq !== null || stop.window;
    if (!hasContent) return;
    if (stop.address) {
      stop.name = stop.name.trim();
      stop.note = stop.note.trim();
      stops.push(stop);
    } else {
      // A "stop" with no address is unusable — surface its pieces instead of dropping them.
      if (stop.name) unparsed.push(stop.name);
      if (stop.window) unparsed.push(stop.window.raw);
      if (stop.seq !== null) unparsed.push(String(stop.seq));
    }
  }

  // Short ALL-CAPS trailers under an address cell ("AM/PM", "WALMART3081", "QUIK STOP 162").
  function isNoteLike(line) {
    return line.length <= 28 && line.split(' ').length <= 4 && !/[a-z]/.test(line) && !isAddressStart(line);
  }

  function assembleRows(tagged) {
    var stops = [], unparsed = [];
    var cur = newStop();
    var lastWasAddr = false;

    for (var i = 0; i < tagged.length; i++) {
      var t = tagged[i], line = t.line;
      switch (t.cls) {
        case 'header':
          break;
        case 'seq':
          finalize(cur, stops, unparsed); cur = newStop();
          cur.seq = parseInt(line, 10);
          lastWasAddr = false;
          break;
        case 'time':
          if (cur.address || (cur.window && cur.name)) { finalize(cur, stops, unparsed); cur = newStop(); }
          cur.window = parseWindow(line);
          lastWasAddr = false;
          break;
        case 'addr':
          if (cur.address) {
            if (lastWasAddr && isNoteLike(line)) { cur.note += (cur.note ? ' ' : '') + line; break; }
            finalize(cur, stops, unparsed); cur = newStop();
          }
          cur.address = line;
          lastWasAddr = true;
          break;
        case 'citycont':
          if (lastWasAddr && cur.address) {
            var m = /^(CA|CALIFORNIA)\b[.,]?\s*(.*)$/i.exec(line);
            if (m && !/,\s*(CA|CALIFORNIA)\b/i.test(cur.address)) {
              cur.address = cur.address.replace(/,?\s*$/, ', ') + m[1].toUpperCase();
              if (m[2]) cur.note += (cur.note ? ' ' : '') + m[2];
            } else if (!CITY_STATE.test(cur.address)) {
              cur.address = cur.address.replace(/,?\s*$/, ', ') + line;
            } else {
              cur.note += (cur.note ? ' ' : '') + line;
            }
          } else {
            unparsed.push(line);
          }
          break;
        default: // name
          if (cur.address) {
            if (isNoteLike(line)) { cur.note += (cur.note ? ' ' : '') + line; lastWasAddr = false; break; }
            finalize(cur, stops, unparsed); cur = newStop();
          }
          cur.name += (cur.name ? ' ' : '') + line;
          lastWasAddr = false;
      }
    }
    finalize(cur, stops, unparsed);
    return { stops: stops, unparsed: unparsed };
  }

  function assembleColumns(tagged) {
    var seqs = [], times = [], names = [], addrs = [], unparsed = [];
    var lastAddr = null;

    for (var i = 0; i < tagged.length; i++) {
      var t = tagged[i], line = t.line;
      if (t.cls === 'header') continue;
      if (t.cls === 'seq') { seqs.push(parseInt(line, 10)); lastAddr = null; }
      else if (t.cls === 'time') { times.push(parseWindow(line)); lastAddr = null; }
      else if (t.cls === 'addr') { lastAddr = { address: line, note: '' }; addrs.push(lastAddr); }
      else if (t.cls === 'citycont' && lastAddr) {
        var m = /^(CA|CALIFORNIA)\b[.,]?\s*(.*)$/i.exec(line);
        if (m && !/,\s*(CA|CALIFORNIA)\b/i.test(lastAddr.address)) {
          lastAddr.address = lastAddr.address.replace(/,?\s*$/, ', ') + m[1].toUpperCase();
          if (m[2]) lastAddr.note += (lastAddr.note ? ' ' : '') + m[2];
        } else lastAddr.address = lastAddr.address.replace(/,?\s*$/, ', ') + line;
      }
      else if (lastAddr && isNoteLike(line)) { lastAddr.note += (lastAddr.note ? ' ' : '') + line; }
      else if (t.cls === 'name') { names.push(line); lastAddr = null; }
      else unparsed.push(line);
    }

    // Wrapped name cells inflate the name count; fold digit-free short fragments
    // (or street-suffix spillovers like "FREEPORT BLVD") into the previous name.
    while (names.length > addrs.length) {
      var merged = false;
      for (var j = 1; j < names.length; j++) {
        var frag = names[j];
        var wrappy = frag.split(' ').length <= 2 || STREET_SUFFIX.test(frag);
        if (wrappy && !/\d/.test(frag)) { names[j - 1] += ' ' + frag; names.splice(j, 1); merged = true; break; }
      }
      if (!merged) break;
    }

    var stops = [];
    for (var k = 0; k < addrs.length; k++) {
      var s = newStop();
      s.address = addrs[k].address;
      s.note = addrs[k].note;
      s.name = names[k] || '';
      s.window = times[k] || null;
      s.seq = (seqs[k] !== undefined) ? seqs[k] : null;
      stops.push(s);
    }
    for (var u = addrs.length; u < names.length; u++) unparsed.push(names[u]);
    return { stops: stops, unparsed: unparsed };
  }

  function detectLayout(tagged) {
    var maxAddrRun = 0, run = 0, addrCount = 0, timeCount = 0, seqCount = 0;
    for (var i = 0; i < tagged.length; i++) {
      var c = tagged[i].cls;
      if (c === 'header') continue;
      if (c === 'addr') { run++; addrCount++; maxAddrRun = Math.max(maxAddrRun, run); }
      else if (c !== 'citycont' && !(run > 0 && c === 'name' && isNoteLike(tagged[i].line))) run = 0;
      if (c === 'time') timeCount++;
      if (c === 'seq') seqCount++;
    }
    if (addrCount > 0 && timeCount === 0 && seqCount === 0 && maxAddrRun >= addrCount * 0.8 && addrCount >= 2) return 'addresses';
    if (maxAddrRun >= 3) return 'columns';
    return 'rows';
  }

  function parseSheet(text) {
    nextId = 1;
    var lines = mergeTimeFragments(
      String(text || '').split(/\r?\n/).map(normLine).filter(Boolean)
    );
    var tagged = lines.map(function (l) { return { line: l, cls: classify(l) }; });
    var layout = detectLayout(tagged);

    var result;
    if (layout === 'addresses') {
      var stops = [];
      for (var i = 0; i < tagged.length; i++) {
        if (tagged[i].cls === 'header') continue;
        var s = newStop();
        s.address = tagged[i].line;
        stops.push(s);
      }
      result = { stops: stops, unparsed: [] };
    } else if (layout === 'columns') {
      result = assembleColumns(tagged);
    } else {
      result = assembleRows(tagged);
    }

    result.layout = layout;
    return result;
  }

  /* ── geometry & optimization ────────────────────────────────────── */

  function haversineKm(a, b) {
    var R = 6371, D = Math.PI / 180;
    var dLat = (b.lat - a.lat) * D, dLng = (b.lng - a.lng) * D;
    var s = Math.sin(dLat / 2), t = Math.sin(dLng / 2);
    var h = s * s + Math.cos(a.lat * D) * Math.cos(b.lat * D) * t * t;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /*
   * stops: [{id, lat, lng}] — all must have coordinates.
   * opts:  { start: {lat,lng} | null, roundTrip: bool }
   * Returns { order: [id...], totalKm } — near-optimal visiting order
   * (nearest-neighbor seed + 2-opt refinement; exact enough for n ≤ 60).
   */
  function optimizeRoute(stops, opts) {
    opts = opts || {};
    var n = stops.length;
    if (n <= 1) return { order: stops.map(function (s) { return s.id; }), totalKm: 0 };

    var pts = stops.map(function (s) { return { lat: s.lat, lng: s.lng }; });
    var start = opts.start || null;
    var round = !!opts.roundTrip;

    var d = [];
    for (var i = 0; i < n; i++) {
      d.push(new Array(n));
      for (var j = 0; j < n; j++) d[i][j] = i === j ? 0 : haversineKm(pts[i], pts[j]);
    }
    var dStart = start ? pts.map(function (p) { return haversineKm(start, p); }) : null;

    // nearest-neighbor seed
    var visited = new Array(n).fill(false);
    var order = [];
    var first = 0;
    if (dStart) {
      var best = Infinity;
      for (i = 0; i < n; i++) if (dStart[i] < best) { best = dStart[i]; first = i; }
    }
    order.push(first); visited[first] = true;
    while (order.length < n) {
      var last = order[order.length - 1], nb = -1, nd = Infinity;
      for (i = 0; i < n; i++) if (!visited[i] && d[last][i] < nd) { nd = d[last][i]; nb = i; }
      order.push(nb); visited[nb] = true;
    }

    function cost(ord) {
      var c = dStart ? dStart[ord[0]] : 0;
      for (var x = 0; x < ord.length - 1; x++) c += d[ord[x]][ord[x + 1]];
      if (round && dStart) c += dStart[ord[ord.length - 1]];
      return c;
    }

    // 2-opt: reverse segments while it helps
    var improved = true, guard = 0;
    while (improved && guard++ < 200) {
      improved = false;
      for (i = 0; i < n - 1; i++) {
        for (j = i + 1; j < n; j++) {
          var before = (i === 0 ? (dStart ? dStart[order[0]] : 0) : d[order[i - 1]][order[i]])
            + (j === n - 1 ? (round && dStart ? dStart[order[j]] : 0) : d[order[j]][order[j + 1]]);
          var after = (i === 0 ? (dStart ? dStart[order[j]] : 0) : d[order[i - 1]][order[j]])
            + (j === n - 1 ? (round && dStart ? dStart[order[i]] : 0) : d[order[i]][order[j + 1]]);
          if (after < before - 1e-9) {
            for (var lo = i, hi = j; lo < hi; lo++, hi--) {
              var tmp = order[lo]; order[lo] = order[hi]; order[hi] = tmp;
            }
            improved = true;
          }
        }
      }
    }

    return {
      order: order.map(function (idx) { return stops[idx].id; }),
      totalKm: cost(order)
    };
  }

  /*
   * ETA feasibility against time windows.
   * orderedStops: [{id, lat, lng, window}], with coordinates.
   * opts: { start: {lat,lng}|null, departMin, speedKmh, serviceMin }
   * Returns per-stop { id, arriveMin, departMin, status } where status is
   * 'ok' | 'early' (arrive before window opens; assumes waiting) | 'late'.
   */
  function buildEtas(orderedStops, opts) {
    opts = opts || {};
    var speed = opts.speedKmh || 35;
    var service = opts.serviceMin != null ? opts.serviceMin : 5;
    var t = opts.departMin != null ? opts.departMin : 8 * 60;
    var prev = opts.start || null;
    var out = [];

    for (var i = 0; i < orderedStops.length; i++) {
      var s = orderedStops[i];
      var km = prev && s.lat != null ? haversineKm(prev, s) : 0;
      t += (km / speed) * 60 * 1.3; // 1.3 ≈ street grid vs straight line
      var arrive = t, status = 'ok';
      if (s.window) {
        if (arrive < s.window.start) { status = 'early'; t = s.window.start; }
        else if (arrive > s.window.end) status = 'late';
      }
      t += service;
      out.push({ id: s.id, arriveMin: Math.round(arrive), departMin: Math.round(t), status: status });
      if (s.lat != null) prev = { lat: s.lat, lng: s.lng };
    }
    return out;
  }

  function fmtMin(min) {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), m = min % 60;
    var ap = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }

  /* ── address & Google Maps helpers ──────────────────────────────── */

  function cacheKey(address) {
    return String(address || '').toUpperCase().replace(/\s+/g, ' ').replace(/[.]+$/, '').trim();
  }

  /* Query string for geocoders: street + city + state only, suite/# fragments stripped. */
  function geocodeQuery(address, defaultCityState) {
    var a = cacheKey(address)
      .replace(/\b(STE|SUITE|UNIT|APT|BLDG)\s*[#]?\s*[\w-]+/g, '')
      .replace(/#\s*[\w-]+/g, '')
      .replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
    if (!/,\s*(CA|CALIFORNIA)\b/.test(a) && defaultCityState) {
      a = a.replace(/,?\s*$/, ', ') + defaultCityState.toUpperCase();
    }
    return a;
  }

  /* Handoff carries address text, not lat/lng — Google's own geocoding is
     more precise than free-geocoder street interpolation. */
  function mapsUrlsForStop(address) {
    var q = encodeURIComponent(address);
    return {
      scheme: 'comgooglemaps://?daddr=' + q + '&directionsmode=driving',
      web: 'https://www.google.com/maps/dir/?api=1&destination=' + q + '&travelmode=driving&dir_action=navigate',
      apple: 'https://maps.apple.com/?daddr=' + q + '&dirflg=d'
    };
  }

  /* Google Maps allows origin + 9 waypoints + destination per link (app/desktop).
     Origin omitted → current location. size must stay ≤ 10. */
  function chunkLegs(addresses, size) {
    size = Math.min(size || 10, 10);
    var legs = [];
    for (var i = 0; i < addresses.length; i += size) legs.push(addresses.slice(i, i + size));
    return legs;
  }

  function mapsUrlForLeg(addresses) {
    if (!addresses.length) return null;
    var dest = addresses[addresses.length - 1];
    var way = addresses.slice(0, -1);
    var url = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dest) + '&travelmode=driving';
    if (way.length) url += '&waypoints=' + way.map(encodeURIComponent).join('%7C');
    return url;
  }

  return {
    parseSheet: parseSheet,
    classify: classify,
    haversineKm: haversineKm,
    optimizeRoute: optimizeRoute,
    buildEtas: buildEtas,
    fmtMin: fmtMin,
    cacheKey: cacheKey,
    geocodeQuery: geocodeQuery,
    mapsUrlsForStop: mapsUrlsForStop,
    chunkLegs: chunkLegs,
    mapsUrlForLeg: mapsUrlForLeg
  };
});
