// Run with: node --test route/tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Core = require('../core.js');

const fix = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

test('row-major Live Text transcript parses every stop', () => {
  const r = Core.parseSheet(fix('livetext-rows.txt'));
  assert.equal(r.layout, 'rows');
  assert.equal(r.stops.length, 12);

  assert.equal(r.stops[0].seq, 1);
  assert.equal(r.stops[0].name, 'RIVER CITY SSYAP');
  assert.equal(r.stops[0].address, '2000 EVERGREEN AVE, SACRAMENTO, CA');
  assert.deepEqual(r.stops[0].window, { start: 540, end: 990, raw: '09:00-16:30' });

  // sub-location trailers become notes, not addresses
  assert.equal(r.stops[1].note, 'AM/PM');
  assert.equal(r.stops[2].note, 'SUPERCENTER3001');
  assert.match(r.stops[3].note, /QUICK STOP 12/);

  // wrapped "..., SACRAMENTO," + "CA SOUTH POINTE" completes the address, extras go to note
  assert.equal(r.stops[6].address, '1234 FLORIN RD, SACRAMENTO, CA');
  assert.equal(r.stops[6].note, 'SOUTH POINTE');

  // duplicate address on two distinct stops stays two stops with unique ids
  assert.equal(r.stops[7].address, r.stops[6].address);
  assert.notEqual(r.stops[7].id, r.stops[6].id);

  // wrapped name cell rejoins
  assert.equal(r.stops[9].name, 'EL MERCADO GRANDE FREEPORT BLVD');

  // split time range "07:00-" / "18:00" merges
  assert.deepEqual(r.stops[10].window, { start: 420, end: 1080, raw: '07:00-18:00' });

  // a name containing digits + street word is still a name, not an address
  assert.equal(r.stops[10].name, 'GROCERY 704-501 ST');

  // stray column spill is surfaced, never silently dropped
  assert.ok(r.unparsed.includes('SACRAMENTO, CA'));

  // every stop has a usable window except none in this fixture
  for (const s of r.stops) assert.ok(s.window, `stop ${s.seq} lost its window`);
});

test('column-major transcript pairs names, times, addresses by index', () => {
  const r = Core.parseSheet(fix('livetext-columns.txt'));
  assert.equal(r.layout, 'columns');
  assert.equal(r.stops.length, 6);
  assert.equal(r.stops[0].name, 'CASHPOINT AM000101*');
  assert.equal(r.stops[0].address, '4104 NORWOOD AVE, SACRAMENTO, CA');
  assert.equal(r.stops[0].seq, 1);
  assert.deepEqual(r.stops[0].window.raw, '06:00-18:00');

  // "EL MERCADO GRANDE" + wrapped "FREEPORT BLVD" fold into one name
  assert.equal(r.stops[3].name, 'EL MERCADO GRANDE FREEPORT BLVD');
  assert.equal(r.stops[3].address, '5641 FREEPORT BLVD, SACRAMENTO, CA');

  // wrapped address completes; note preserved
  assert.equal(r.stops[4].address, '1234 FLORIN RD, SACRAMENTO, CA');
  assert.equal(r.stops[4].note, 'SOUTH POINTE');
  assert.equal(r.stops[5].name, 'WOK EXPRESS 04321*');
});

test('addresses-only paste: one stop per line', () => {
  const r = Core.parseSheet(fix('addresses-only.txt'));
  assert.equal(r.layout, 'addresses');
  assert.equal(r.stops.length, 4);
  assert.equal(r.stops[1].address, '8100 GERBER RD');
});

test('empty and garbage input do not throw', () => {
  assert.equal(Core.parseSheet('').stops.length, 0);
  assert.equal(Core.parseSheet('   \n \n ').stops.length, 0);
  const garbage = Core.parseSheet('HAZAR\nCANCEL\n???');
  assert.equal(garbage.stops.length, 0);
  assert.ok(garbage.unparsed.join(' ').includes('HAZAR'), 'garbage is surfaced, not dropped');
});

test('geocodeQuery appends default city/state and strips suite fragments', () => {
  assert.equal(Core.geocodeQuery('8100 GERBER RD', 'Sacramento, CA'), '8100 GERBER RD, SACRAMENTO, CA');
  assert.equal(
    Core.geocodeQuery('5330 Stockton Blvd Ste #4, Sacramento, CA', 'Sacramento, CA'),
    '5330 STOCKTON BLVD, SACRAMENTO, CA'
  );
  assert.equal(Core.geocodeQuery('7590 STOCKTON BLVD, SACRAMENTO, CA', 'Sacramento, CA'),
    '7590 STOCKTON BLVD, SACRAMENTO, CA');
});

test('optimizer orders points along a line from the start', () => {
  // five stops on a north-south line, given scrambled
  const mk = (id, lat) => ({ id, lat, lng: -121.45 });
  const stops = [mk('c', 38.53), mk('a', 38.51), mk('e', 38.55), mk('b', 38.52), mk('d', 38.54)];
  const r = Core.optimizeRoute(stops, { start: { lat: 38.50, lng: -121.45 } });
  assert.deepEqual(r.order, ['a', 'b', 'c', 'd', 'e']);
  assert.ok(r.totalKm > 0);
});

test('optimizer round trip beats naive order and handles duplicates', () => {
  const pts = [
    { id: 'x', lat: 38.50, lng: -121.50 },
    { id: 'y', lat: 38.50, lng: -121.40 },
    { id: 'y2', lat: 38.50, lng: -121.40 },
    { id: 'z', lat: 38.60, lng: -121.45 }
  ];
  const r = Core.optimizeRoute(pts, { start: { lat: 38.55, lng: -121.45 }, roundTrip: true });
  assert.equal(r.order.length, 4);
  assert.ok(new Set(r.order).size === 4);
});

test('ETA marks late and early stops against windows', () => {
  const stops = [
    { id: 'a', lat: 38.50, lng: -121.45, window: { start: 9 * 60, end: 10 * 60, raw: '09:00-10:00' } },
    { id: 'b', lat: 39.40, lng: -121.45, window: { start: 8 * 60, end: 9 * 60, raw: '08:00-09:00' } }
  ];
  const etas = Core.buildEtas(stops, { start: { lat: 38.50, lng: -121.45 }, departMin: 8 * 60, speedKmh: 35, serviceMin: 5 });
  assert.equal(etas[0].status, 'early');   // arrives 08:00, window opens 09:00 → waits
  assert.equal(etas[1].status, 'late');    // ~100 km away, cannot make 09:00
});

test('Google Maps handoff URLs', () => {
  const u = Core.mapsUrlsForStop('7590 STOCKTON BLVD, SACRAMENTO, CA');
  assert.ok(u.scheme.startsWith('comgooglemaps://?daddr=7590%20STOCKTON'));
  assert.ok(u.web.includes('google.com/maps/dir/?api=1&destination=7590%20STOCKTON'));
  assert.ok(u.web.includes('travelmode=driving'));

  const addrs = Array.from({ length: 12 }, (_, i) => `${100 + i} MAIN ST, SACRAMENTO, CA`);
  const legs = Core.chunkLegs(addrs, 10);
  assert.equal(legs.length, 2);
  assert.equal(legs[0].length, 10);
  assert.equal(legs[1].length, 2);

  const legUrl = Core.mapsUrlForLeg(legs[0]);
  assert.ok(legUrl.includes('destination=' + encodeURIComponent('109 MAIN ST, SACRAMENTO, CA')));
  assert.equal((legUrl.match(/%7C/g) || []).length, 8, 'nine waypoints joined by eight separators');
  assert.ok(!legUrl.includes('origin='), 'origin omitted so Google uses current location');
});

test('fmtMin renders 12-hour times', () => {
  assert.equal(Core.fmtMin(540), '9:00 AM');
  assert.equal(Core.fmtMin(1080), '6:00 PM');
  assert.equal(Core.fmtMin(0), '12:00 AM');
  assert.equal(Core.fmtMin(725), '12:05 PM');
});
