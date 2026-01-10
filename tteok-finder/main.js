document.addEventListener('DOMContentLoaded', () => {
    const regionInput = document.getElementById('region-input');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('results-container');

    // --- API 연동 가이드 ---
    // 1. 카카오 개발자 사이트(https://developers.kakao.com/)에서 앱을 만들고 JavaScript 키를 발급받으세요.
    // 2. 아래 'YOUR_KAKAO_API_KEY' 부분을 발급받은 키로 교체하세요.
    // 3. 카카오맵 SDK를 index.html에 추가해야 합니다. 아래 script 태그를 index.html의 <head> 안에 추가하세요.
    //    <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_API_KEY&libraries=services"></script>
    const KAKAO_API_KEY = 'YOUR_KAKAO_API_KEY';

    searchButton.addEventListener('click', () => {
        const query = regionInput.value;
        if (!query) {
            alert('지역명을 입력해주세요.');
            return;
        }

        // KAKAO_API_KEY가 설정되지 않았을 경우, 샘플 데이터로 기능을 시연합니다.
        if (KAKAO_API_KEY === 'YOUR_KAKAO_API_KEY') {
            console.warn('카카오 API 키가 설정되지 않았습니다. 샘플 데이터를 표시합니다.');
            displaySampleData();
            return;
        }
        
        // 실제 카카오맵 API를 호출하는 부분
        searchWithKakaoAPI(query);
    });

    function searchWithKakaoAPI(query) {
        // 장소 검색 객체를 생성합니다
        const ps = new kakao.maps.services.Places();
        const keyword = query + ' 떡집';

        // 키워드로 장소를 검색합니다
        ps.keywordSearch(keyword, (data, status, pagination) => {
            if (status === kakao.maps.services.Status.OK) {
                displayResults(data);
            } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                alert('검색 결과가 존재하지 않습니다.');
                resultsContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
            } else if (status === kakao.maps.services.Status.ERROR) {
                alert('검색 중 오류가 발생했습니다.');
                console.error('Kakao Maps API Error:', pagination);
            }
        });
    }
    
    function displayResults(places) {
        resultsContainer.innerHTML = ''; // 이전 결과 초기화
        if (!places || places.length === 0) {
            resultsContainer.innerHTML = '<p>결과 없음</p>';
            return;
        }

        places.forEach(place => {
            const item = document.createElement('div');
            item.className = 'result-item';

            item.innerHTML = `
                <h3>${place.place_name}</h3>
                <p class="address">${place.road_address_name || place.address_name}</p>
                <p class="phone">${place.phone || '전화번호 정보 없음'}</p>
            `;
            resultsContainer.appendChild(item);
        });
    }

    function displaySampleData() {
        const sampleData = [
            {
                place_name: '경기떡집',
                road_address_name: '서울 마포구 월드컵로19길 12',
                address_name: '서울 마포구 망원동 477-19',
                phone: '02-333-8880'
            },
            {
                place_name: '낙원떡집',
                road_address_name: '서울 종로구 삼일대로 440',
                address_name: '서울 종로구 낙원동 274-1',
                phone: '02-742-4828'
            },
            {
                place_name: '비원떡집',
                road_address_name: '서울 종로구 율곡로 20',
                address_name: '서울 종로구 수송동 25-2',
                phone: '02-765-4928'
            }
        ];
        displayResults(sampleData);
    }
});