import fs from 'node:fs';

const items = JSON.parse(fs.readFileSync(new URL('../data.json', import.meta.url)));
const pages = JSON.parse(fs.readFileSync('/tmp/camping-db-real-routes.json')).results;
const ids = new Map(pages.map(page => [page.properties['후보명'].title[0]?.plain_text, page.id]));
const routes = JSON.parse(fs.readFileSync(new URL('../routes.json', import.meta.url)));
const home = { lat: 37.5190, lng: 126.8890, label: '우리 집(문래)' };

for (const item of items) {
  if (!ids.has(item.name)) throw new Error(`Missing Notion page: ${item.name}`);
  const route = routes[item.name];
  const naver = `https://map.naver.com/p/search/${encodeURIComponent(item.name)}`;
  const kakao = `https://map.kakao.com/link/from/${encodeURIComponent(home.label)},${home.lat},${home.lng}/to/${encodeURIComponent(item.name)},${item.lat},${item.lng}`;
  console.log(JSON.stringify({ id: ids.get(item.name), body: { properties: {
    '실제 차량 거리(km)': { number: route?.km ?? null },
    '실제 예상 시간(분)': { number: route?.min ?? null },
    '위도': { number: item.lat },
    '경도': { number: item.lng },
    '좌표': { select: { name: item.coord } },
    '권역': { select: { name: item.region } },
    '운영·주소': { select: { name: item.operation } },
    '주소': { rich_text: [{ text: { content: item.address } }] },
    '공식 URL': { url: item.official || null },
    '예약 URL': { url: item.booking || null },
    '가격·기간': { rich_text: [{ text: { content: item.price } }] },
    '검증 메모': { rich_text: [{ text: { content: item.note } }] },
    '길찾기 검증': { select: { name: route ? '네이버 자동차 결과 확인' : '대상 미확인·조회 보류' } },
    '길찾기 근거': { rich_text: [{ text: { content: route ? `네이버 지도 자동차 길찾기 결과 · ${route.checkedAt} · 실제 주소/좌표 비공개` : '공식 대상 명칭/주소 미확인으로 잘못된 장소 매칭을 방지하기 위해 실제 경로 조회 보류' } }] },
    '네이버 지도': { url: naver },
    '카카오 길찾기': { url: kakao }
  } } }));
}
