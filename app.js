const home = { lat: 37.519, lng: 126.889, label: '우리 집(문래)' };
const bounds = { minLat: 37.15, maxLat: 38.15, minLng: 126.15, maxLng: 127.25 };
const pins = document.querySelector('#pins');
const detail = document.querySelector('#detail');

const position = ({ lat, lng }) => ({
  left: `${((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100}%`,
  top: `${(1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100}%`
});
const statusClass = value => value === '공식/공공 확인' ? 'verified' : value === '부분 확인' ? 'partial' : 'unknown';
const tag = (value, style = '') => `<span class="tag ${style}">${value}</span>`;
const safeMapLink = item => `https://map.naver.com/p/search/${encodeURIComponent(item.name)}`;
const kakaoLink = item => `https://map.kakao.com/link/from/${encodeURIComponent(home.label)},${home.lat},${home.lng}/to/${encodeURIComponent(item.name)},${item.lat},${item.lng}`;
const tentIcon = `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13.25"/><path d="M7.5 22.2 15.9 9.5l8.6 12.7M11.1 22.2l4.8-7.1 4.9 7.1M15.9 15.1v7.1M6.1 23.1h19.8"/></svg>`;
const homeIcon = `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13.25"/><path d="m8.3 15.1 7.7-6.5 7.7 6.5v8.2H8.3zM13.1 23.3v-5.6h5.8v5.6"/></svg>`;

const homePin = document.createElement('div');
homePin.className = 'home-marker';
Object.assign(homePin.style, position(home));
homePin.innerHTML = `${homeIcon}<span>${home.label}</span>`;
pins.append(homePin);

Promise.all([fetch('data.json').then(r => r.json()), fetch('routes.json').then(r => r.json())]).then(([items, routes]) => {
  const showDetail = item => {
    document.querySelectorAll('.pin-button.active').forEach(pin => pin.classList.remove('active'));
    document.querySelector(`[data-name="${CSS.escape(item.name)}"]`)?.classList.add('active');
    const route = routes[item.name];
    const status = statusClass(item.operation);
    const routeInfo = route
      ? `<div class="route"><b>네이버 자동차 결과 · ${route.km}km / 약 ${route.min}분</b><br><small>${route.checkedAt} 조회 · 실제 주소·좌표 비공개</small></div>`
      : '<div class="route"><b>추천 제외 · 실제 자동차 경로 조회 보류</b><br><small>출처·위치가 미검증이라 다른 장소로 임의 매칭하지 않았습니다.</small></div>';
    const official = item.official ? `<a href="${item.official}" target="_blank" rel="noopener">공식 채널 ↗</a>` : '';
    const booking = item.booking ? `<a href="${item.booking}" target="_blank" rel="noopener">예약/정보 ↗</a>` : '';
    detail.innerHTML = `<h2>${item.name}</h2><div class="tags">${tag(item.area)}${tag(item.operation, status === 'unknown' ? 'bad' : status === 'partial' ? 'warn' : '')}${tag(`좌표: ${item.coord}`, 'warn')}</div>${routeInfo}<p><b>동계 장박</b> · ${item.winter}</p><p><b>가격/기간</b> · ${item.price}</p><p><b>주소</b> · ${item.address}</p><p>${item.note}</p><div class="links"><a href="${safeMapLink(item)}" target="_blank" rel="noopener">네이버 지도 ↗</a><a href="${kakaoLink(item)}" target="_blank" rel="noopener">카카오 길찾기 ↗</a>${official}${booking}</div>`;
  };
  items.forEach(item => {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = `pin-button ${statusClass(item.operation)}`;
    pin.dataset.name = item.name;
    pin.setAttribute('aria-label', `${item.name} 상세 보기`);
    pin.innerHTML = tentIcon;
    Object.assign(pin.style, position(item));
    pin.addEventListener('mouseenter', () => showDetail(item));
    pin.addEventListener('focus', () => showDetail(item));
    pin.addEventListener('click', () => showDetail(item));
    pins.append(pin);
  });
  document.querySelector('#count').textContent = `${items.length}개 후보 · 네이버 자동차 결과 ${Object.keys(routes).length}개 확인`;
});
