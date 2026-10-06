import fs from 'node:fs';

const items = JSON.parse(fs.readFileSync(new URL('../data.json', import.meta.url)));
const pages = JSON.parse(fs.readFileSync('/tmp/camping-db-verify.json')).results;
const ids = new Map(pages.map(page => [page.properties['후보명'].title[0]?.plain_text, page.id]));
const home = { lat: 37.5163, lng: 126.8958, label: '우리 집(문래동)' };
const radians = value => value * Math.PI / 180;

for (const item of items) {
  const a = Math.sin(radians(item.lat - home.lat) / 2) ** 2 + Math.cos(radians(home.lat)) * Math.cos(radians(item.lat)) * Math.sin(radians(item.lng - home.lng) / 2) ** 2;
  const km = Math.round(2 * 6371 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.32);
  const min = Math.round(km / 45 * 60 + 12);
  if (!ids.has(item.name)) throw new Error(`Missing Notion page: ${item.name}`);
  console.log(JSON.stringify({
    id: ids.get(item.name), km, min,
    naver: `https://map.naver.com/p/directions/${home.lng},${home.lat},${encodeURIComponent(home.label)},PLACE_POI/${item.lng},${item.lat},${encodeURIComponent(item.name)},PLACE_POI/car`,
    kakao: `https://map.kakao.com/link/from/${encodeURIComponent(home.label)},${home.lat},${home.lng}/to/${encodeURIComponent(item.name)},${item.lat},${item.lng}`
  }));
}
