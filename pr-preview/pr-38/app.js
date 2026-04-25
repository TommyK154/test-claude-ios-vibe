    (function () {
      "use strict";

      // Preview-deploy banner: the PR preview workflow publishes under
      // /pr-preview/pr-N/ on the same Pages site as production. On those
      // URLs — and ONLY on those URLs — show a green banner identifying
      // which PR this deployment reflects, so a reviewer can never
      // confuse a preview with production. No-op on the production path.
      (function () {
        var m = window.location.pathname.match(/\/pr-preview\/pr-(\d+)\//);
        if (!m) return;
        var banner = document.getElementById("previewBanner");
        if (!banner) return;
        banner.textContent = "PREVIEW DEPLOY · PR #" + m[1] + " · not production";
        banner.hidden = false;
      })();

      // ==================== PRESETS · AIRPORTS ====================

      var PRESETS = [
        { id: "sfo", label: "San Francisco", lat: 37.6188, lon: -122.3754 },
        { id: "lax", label: "Los Angeles",   lat: 33.9416, lon: -118.4085 },
        { id: "jfk", label: "New York",      lat: 40.6413, lon: -73.7781 },
        { id: "ord", label: "Chicago",       lat: 41.9742, lon: -87.9073 },
        { id: "lhr", label: "London",        lat: 51.4700, lon: -0.4543 },
        { id: "cdg", label: "Paris",         lat: 49.0097, lon: 2.5479 },
        { id: "hnd", label: "Tokyo",         lat: 35.5523, lon: 139.7798 },
        { id: "sin", label: "Singapore",     lat: 1.3644,  lon: 103.9915 }
      ];

      // Inline fallback — ~148 commercial airports. Used until airports.js
      // lands (loaded async via a separate <script> tag). `getAirports()`
      // below returns the fallback initially, then upgrades to the full
      // ~7,700-entry OpenFlights dataset once `window.__airports` is set.
      var AIRPORTS_FALLBACK = [
        {iata:"SFO",icao:"KSFO",name:"San Francisco Intl",city:"San Francisco",lat:37.6188,lon:-122.3754},
        {iata:"LAX",icao:"KLAX",name:"Los Angeles Intl",city:"Los Angeles",lat:33.9416,lon:-118.4085},
        {iata:"JFK",icao:"KJFK",name:"John F Kennedy Intl",city:"New York",lat:40.6413,lon:-73.7781},
        {iata:"LGA",icao:"KLGA",name:"LaGuardia",city:"New York",lat:40.7769,lon:-73.8740},
        {iata:"EWR",icao:"KEWR",name:"Newark Liberty Intl",city:"New York",lat:40.6895,lon:-74.1745},
        {iata:"ATL",icao:"KATL",name:"Hartsfield-Jackson",city:"Atlanta",lat:33.6407,lon:-84.4277},
        {iata:"ORD",icao:"KORD",name:"O'Hare Intl",city:"Chicago",lat:41.9742,lon:-87.9073},
        {iata:"MDW",icao:"KMDW",name:"Midway Intl",city:"Chicago",lat:41.7868,lon:-87.7522},
        {iata:"DFW",icao:"KDFW",name:"Dallas/Fort Worth",city:"Dallas",lat:32.8998,lon:-97.0403},
        {iata:"DEN",icao:"KDEN",name:"Denver Intl",city:"Denver",lat:39.8561,lon:-104.6737},
        {iata:"SEA",icao:"KSEA",name:"Sea-Tac",city:"Seattle",lat:47.4502,lon:-122.3088},
        {iata:"LAS",icao:"KLAS",name:"Harry Reid Intl",city:"Las Vegas",lat:36.0840,lon:-115.1537},
        {iata:"MCO",icao:"KMCO",name:"Orlando Intl",city:"Orlando",lat:28.4312,lon:-81.3081},
        {iata:"MIA",icao:"KMIA",name:"Miami Intl",city:"Miami",lat:25.7959,lon:-80.2871},
        {iata:"FLL",icao:"KFLL",name:"Fort Lauderdale",city:"Fort Lauderdale",lat:26.0726,lon:-80.1527},
        {iata:"BOS",icao:"KBOS",name:"Logan Intl",city:"Boston",lat:42.3656,lon:-71.0096},
        {iata:"PHX",icao:"KPHX",name:"Sky Harbor",city:"Phoenix",lat:33.4342,lon:-112.0116},
        {iata:"IAH",icao:"KIAH",name:"George Bush Intl",city:"Houston",lat:29.9902,lon:-95.3368},
        {iata:"HOU",icao:"KHOU",name:"Hobby",city:"Houston",lat:29.6454,lon:-95.2789},
        {iata:"MSP",icao:"KMSP",name:"Minneapolis-St Paul",city:"Minneapolis",lat:44.8848,lon:-93.2223},
        {iata:"DTW",icao:"KDTW",name:"Detroit Metro",city:"Detroit",lat:42.2124,lon:-83.3534},
        {iata:"PHL",icao:"KPHL",name:"Philadelphia Intl",city:"Philadelphia",lat:39.8744,lon:-75.2424},
        {iata:"BWI",icao:"KBWI",name:"Baltimore/Washington",city:"Baltimore",lat:39.1754,lon:-76.6683},
        {iata:"DCA",icao:"KDCA",name:"Reagan National",city:"Washington",lat:38.8512,lon:-77.0402},
        {iata:"IAD",icao:"KIAD",name:"Dulles Intl",city:"Washington",lat:38.9531,lon:-77.4565},
        {iata:"SLC",icao:"KSLC",name:"Salt Lake City",city:"Salt Lake City",lat:40.7899,lon:-111.9791},
        {iata:"SAN",icao:"KSAN",name:"San Diego Intl",city:"San Diego",lat:32.7336,lon:-117.1897},
        {iata:"PDX",icao:"KPDX",name:"Portland Intl",city:"Portland",lat:45.5898,lon:-122.5951},
        {iata:"HNL",icao:"PHNL",name:"Daniel K Inouye",city:"Honolulu",lat:21.3245,lon:-157.9251},
        {iata:"ANC",icao:"PANC",name:"Ted Stevens Anchorage",city:"Anchorage",lat:61.1744,lon:-149.9961},
        {iata:"TPA",icao:"KTPA",name:"Tampa Intl",city:"Tampa",lat:27.9755,lon:-82.5332},
        {iata:"STL",icao:"KSTL",name:"St Louis Lambert",city:"St Louis",lat:38.7487,lon:-90.3700},
        {iata:"AUS",icao:"KAUS",name:"Austin-Bergstrom",city:"Austin",lat:30.1945,lon:-97.6699},
        {iata:"BNA",icao:"KBNA",name:"Nashville Intl",city:"Nashville",lat:36.1245,lon:-86.6782},
        {iata:"RDU",icao:"KRDU",name:"Raleigh-Durham",city:"Raleigh",lat:35.8776,lon:-78.7875},
        {iata:"CLT",icao:"KCLT",name:"Charlotte Douglas",city:"Charlotte",lat:35.2140,lon:-80.9431},
        {iata:"MCI",icao:"KMCI",name:"Kansas City Intl",city:"Kansas City",lat:39.2976,lon:-94.7139},
        {iata:"IND",icao:"KIND",name:"Indianapolis Intl",city:"Indianapolis",lat:39.7173,lon:-86.2944},
        {iata:"CLE",icao:"KCLE",name:"Cleveland Hopkins",city:"Cleveland",lat:41.4117,lon:-81.8498},
        {iata:"PIT",icao:"KPIT",name:"Pittsburgh Intl",city:"Pittsburgh",lat:40.4915,lon:-80.2329},
        {iata:"OAK",icao:"KOAK",name:"Oakland Intl",city:"Oakland",lat:37.7213,lon:-122.2208},
        {iata:"SJC",icao:"KSJC",name:"Mineta San Jose",city:"San Jose",lat:37.3626,lon:-121.9290},
        {iata:"SMF",icao:"KSMF",name:"Sacramento Intl",city:"Sacramento",lat:38.6954,lon:-121.5908},
        {iata:"SNA",icao:"KSNA",name:"John Wayne",city:"Orange County",lat:33.6757,lon:-117.8682},
        {iata:"SZP",icao:"KSZP",name:"Santa Paula",city:"Santa Paula",lat:34.3472,lon:-119.0606},
        {iata:"VNY",icao:"KVNY",name:"Van Nuys",city:"Los Angeles",lat:34.2098,lon:-118.4899},
        {iata:"BUR",icao:"KBUR",name:"Hollywood Burbank",city:"Burbank",lat:34.2007,lon:-118.3587},
        {iata:"LGB",icao:"KLGB",name:"Long Beach",city:"Long Beach",lat:33.8177,lon:-118.1516},
        {iata:"SBA",icao:"KSBA",name:"Santa Barbara Muni",city:"Santa Barbara",lat:34.4262,lon:-119.8403},
        {iata:"MRY",icao:"KMRY",name:"Monterey Regional",city:"Monterey",lat:36.5870,lon:-121.8429},
        {iata:"SMO",icao:"KSMO",name:"Santa Monica Muni",city:"Santa Monica",lat:34.0158,lon:-118.4513},
        {iata:"PAO",icao:"KPAO",name:"Palo Alto",city:"Palo Alto",lat:37.4611,lon:-122.1150},
        {iata:"SQL",icao:"KSQL",name:"San Carlos",city:"San Carlos",lat:37.5119,lon:-122.2495},
        {iata:"HWD",icao:"KHWD",name:"Hayward Executive",city:"Hayward",lat:37.6592,lon:-122.1222},
        {iata:"LVK",icao:"KLVK",name:"Livermore Muni",city:"Livermore",lat:37.6934,lon:-121.8203},
        {iata:"RNO",icao:"KRNO",name:"Reno-Tahoe",city:"Reno",lat:39.4991,lon:-119.7681},
        {iata:"TRK",icao:"KTRK",name:"Truckee Tahoe",city:"Truckee",lat:39.3200,lon:-120.1397},
        {iata:"SBP",icao:"KSBP",name:"San Luis Obispo",city:"San Luis Obispo",lat:35.2368,lon:-120.6420},
        {iata:"FAT",icao:"KFAT",name:"Fresno Yosemite",city:"Fresno",lat:36.7762,lon:-119.7181},
        {iata:"BFL",icao:"KBFL",name:"Meadows Field",city:"Bakersfield",lat:35.4336,lon:-119.0568},
        {iata:"PSP",icao:"KPSP",name:"Palm Springs Intl",city:"Palm Springs",lat:33.8297,lon:-116.5067},
        {iata:"ONT",icao:"KONT",name:"Ontario Intl",city:"Ontario",lat:34.0560,lon:-117.6012},
        {iata:"SEE",icao:"KSEE",name:"Gillespie Field",city:"El Cajon",lat:32.8262,lon:-116.9724},
        {iata:"CRQ",icao:"KCRQ",name:"McClellan-Palomar",city:"Carlsbad",lat:33.1283,lon:-117.2803},
        {iata:"TEB",icao:"KTEB",name:"Teterboro",city:"Teterboro",lat:40.8501,lon:-74.0606},
        {iata:"HPN",icao:"KHPN",name:"Westchester County",city:"White Plains",lat:41.0670,lon:-73.7076},
        {iata:"BDL",icao:"KBDL",name:"Bradley Intl",city:"Hartford",lat:41.9389,lon:-72.6832},
        {iata:"PVD",icao:"KPVD",name:"T.F. Green",city:"Providence",lat:41.7240,lon:-71.4283},
        {iata:"BUF",icao:"KBUF",name:"Buffalo Niagara",city:"Buffalo",lat:42.9405,lon:-78.7322},
        {iata:"ROC",icao:"KROC",name:"Greater Rochester",city:"Rochester",lat:43.1189,lon:-77.6724},
        {iata:"ALB",icao:"KALB",name:"Albany Intl",city:"Albany",lat:42.7483,lon:-73.8017},
        {iata:"BGR",icao:"KBGR",name:"Bangor Intl",city:"Bangor",lat:44.8074,lon:-68.8281},
        {iata:"PWM",icao:"KPWM",name:"Portland Jetport",city:"Portland ME",lat:43.6462,lon:-70.3093},
        {iata:"MHT",icao:"KMHT",name:"Manchester-Boston",city:"Manchester NH",lat:42.9326,lon:-71.4356},
        {iata:"LHR",icao:"EGLL",name:"Heathrow",city:"London",lat:51.4700,lon:-0.4543},
        {iata:"LGW",icao:"EGKK",name:"Gatwick",city:"London",lat:51.1537,lon:-0.1821},
        {iata:"STN",icao:"EGSS",name:"Stansted",city:"London",lat:51.8860,lon:0.2389},
        {iata:"MAN",icao:"EGCC",name:"Manchester",city:"Manchester",lat:53.3537,lon:-2.2750},
        {iata:"EDI",icao:"EGPH",name:"Edinburgh",city:"Edinburgh",lat:55.9500,lon:-3.3725},
        {iata:"DUB",icao:"EIDW",name:"Dublin",city:"Dublin",lat:53.4213,lon:-6.2701},
        {iata:"CDG",icao:"LFPG",name:"Charles de Gaulle",city:"Paris",lat:49.0097,lon:2.5479},
        {iata:"ORY",icao:"LFPO",name:"Orly",city:"Paris",lat:48.7262,lon:2.3652},
        {iata:"AMS",icao:"EHAM",name:"Schiphol",city:"Amsterdam",lat:52.3105,lon:4.7683},
        {iata:"FRA",icao:"EDDF",name:"Frankfurt",city:"Frankfurt",lat:50.0379,lon:8.5622},
        {iata:"MUC",icao:"EDDM",name:"Munich",city:"Munich",lat:48.3538,lon:11.7861},
        {iata:"BER",icao:"EDDB",name:"Berlin Brandenburg",city:"Berlin",lat:52.3667,lon:13.5033},
        {iata:"ZRH",icao:"LSZH",name:"Zurich",city:"Zurich",lat:47.4647,lon:8.5492},
        {iata:"VIE",icao:"LOWW",name:"Vienna",city:"Vienna",lat:48.1103,lon:16.5697},
        {iata:"MAD",icao:"LEMD",name:"Madrid-Barajas",city:"Madrid",lat:40.4936,lon:-3.5668},
        {iata:"BCN",icao:"LEBL",name:"Barcelona-El Prat",city:"Barcelona",lat:41.2974,lon:2.0833},
        {iata:"FCO",icao:"LIRF",name:"Rome-Fiumicino",city:"Rome",lat:41.8003,lon:12.2389},
        {iata:"MXP",icao:"LIMC",name:"Milan Malpensa",city:"Milan",lat:45.6306,lon:8.7281},
        {iata:"LIS",icao:"LPPT",name:"Lisbon",city:"Lisbon",lat:38.7742,lon:-9.1342},
        {iata:"ATH",icao:"LGAV",name:"Athens",city:"Athens",lat:37.9364,lon:23.9445},
        {iata:"IST",icao:"LTFM",name:"Istanbul",city:"Istanbul",lat:41.2753,lon:28.7519},
        {iata:"SVO",icao:"UUEE",name:"Sheremetyevo",city:"Moscow",lat:55.9726,lon:37.4146},
        {iata:"CPH",icao:"EKCH",name:"Copenhagen",city:"Copenhagen",lat:55.6180,lon:12.6561},
        {iata:"OSL",icao:"ENGM",name:"Oslo",city:"Oslo",lat:60.1976,lon:11.1004},
        {iata:"ARN",icao:"ESSA",name:"Stockholm Arlanda",city:"Stockholm",lat:59.6519,lon:17.9186},
        {iata:"HEL",icao:"EFHK",name:"Helsinki",city:"Helsinki",lat:60.3172,lon:24.9633},
        {iata:"BRU",icao:"EBBR",name:"Brussels",city:"Brussels",lat:50.9014,lon:4.4844},
        {iata:"PRG",icao:"LKPR",name:"Václav Havel Prague",city:"Prague",lat:50.1008,lon:14.2600},
        {iata:"WAW",icao:"EPWA",name:"Warsaw Chopin",city:"Warsaw",lat:52.1657,lon:20.9671},
        {iata:"HND",icao:"RJTT",name:"Haneda",city:"Tokyo",lat:35.5523,lon:139.7798},
        {iata:"NRT",icao:"RJAA",name:"Narita",city:"Tokyo",lat:35.7720,lon:140.3929},
        {iata:"KIX",icao:"RJBB",name:"Kansai",city:"Osaka",lat:34.4347,lon:135.2441},
        {iata:"ICN",icao:"RKSI",name:"Incheon",city:"Seoul",lat:37.4602,lon:126.4407},
        {iata:"GMP",icao:"RKSS",name:"Gimpo",city:"Seoul",lat:37.5583,lon:126.7906},
        {iata:"PEK",icao:"ZBAA",name:"Beijing Capital",city:"Beijing",lat:40.0801,lon:116.5846},
        {iata:"PKX",icao:"ZBAD",name:"Beijing Daxing",city:"Beijing",lat:39.5098,lon:116.4105},
        {iata:"PVG",icao:"ZSPD",name:"Shanghai Pudong",city:"Shanghai",lat:31.1443,lon:121.8083},
        {iata:"SHA",icao:"ZSSS",name:"Shanghai Hongqiao",city:"Shanghai",lat:31.1979,lon:121.3363},
        {iata:"CAN",icao:"ZGGG",name:"Guangzhou Baiyun",city:"Guangzhou",lat:23.3924,lon:113.2988},
        {iata:"HKG",icao:"VHHH",name:"Hong Kong Intl",city:"Hong Kong",lat:22.3080,lon:113.9185},
        {iata:"TPE",icao:"RCTP",name:"Taipei Taoyuan",city:"Taipei",lat:25.0797,lon:121.2342},
        {iata:"SIN",icao:"WSSS",name:"Changi",city:"Singapore",lat:1.3644,lon:103.9915},
        {iata:"KUL",icao:"WMKK",name:"Kuala Lumpur",city:"Kuala Lumpur",lat:2.7456,lon:101.7099},
        {iata:"BKK",icao:"VTBS",name:"Suvarnabhumi",city:"Bangkok",lat:13.6900,lon:100.7501},
        {iata:"DMK",icao:"VTBD",name:"Don Mueang",city:"Bangkok",lat:13.9126,lon:100.6068},
        {iata:"MNL",icao:"RPLL",name:"Ninoy Aquino",city:"Manila",lat:14.5086,lon:121.0194},
        {iata:"CGK",icao:"WIII",name:"Soekarno-Hatta",city:"Jakarta",lat:-6.1256,lon:106.6559},
        {iata:"DEL",icao:"VIDP",name:"Indira Gandhi",city:"Delhi",lat:28.5562,lon:77.1000},
        {iata:"BOM",icao:"VABB",name:"Chhatrapati Shivaji",city:"Mumbai",lat:19.0887,lon:72.8679},
        {iata:"BLR",icao:"VOBL",name:"Kempegowda",city:"Bangalore",lat:13.1986,lon:77.7066},
        {iata:"MAA",icao:"VOMM",name:"Chennai Intl",city:"Chennai",lat:12.9900,lon:80.1693},
        {iata:"DXB",icao:"OMDB",name:"Dubai Intl",city:"Dubai",lat:25.2532,lon:55.3657},
        {iata:"DWC",icao:"OMDW",name:"Dubai World Central",city:"Dubai",lat:24.8969,lon:55.1614},
        {iata:"AUH",icao:"OMAA",name:"Abu Dhabi Intl",city:"Abu Dhabi",lat:24.4330,lon:54.6511},
        {iata:"DOH",icao:"OTHH",name:"Hamad Intl",city:"Doha",lat:25.2731,lon:51.6081},
        {iata:"TLV",icao:"LLBG",name:"Ben Gurion",city:"Tel Aviv",lat:32.0114,lon:34.8867},
        {iata:"JNB",icao:"FAOR",name:"OR Tambo",city:"Johannesburg",lat:-26.1392,lon:28.2460},
        {iata:"CPT",icao:"FACT",name:"Cape Town Intl",city:"Cape Town",lat:-33.9715,lon:18.6021},
        {iata:"SYD",icao:"YSSY",name:"Kingsford Smith",city:"Sydney",lat:-33.9399,lon:151.1753},
        {iata:"MEL",icao:"YMML",name:"Melbourne Intl",city:"Melbourne",lat:-37.6733,lon:144.8430},
        {iata:"BNE",icao:"YBBN",name:"Brisbane Intl",city:"Brisbane",lat:-27.3842,lon:153.1175},
        {iata:"PER",icao:"YPPH",name:"Perth Intl",city:"Perth",lat:-31.9403,lon:115.9672},
        {iata:"AKL",icao:"NZAA",name:"Auckland Intl",city:"Auckland",lat:-37.0082,lon:174.7850},
        {iata:"YYZ",icao:"CYYZ",name:"Toronto Pearson",city:"Toronto",lat:43.6777,lon:-79.6248},
        {iata:"YVR",icao:"CYVR",name:"Vancouver Intl",city:"Vancouver",lat:49.1967,lon:-123.1815},
        {iata:"YUL",icao:"CYUL",name:"Montréal-Trudeau",city:"Montreal",lat:45.4577,lon:-73.7497},
        {iata:"MEX",icao:"MMMX",name:"Mexico City Intl",city:"Mexico City",lat:19.4361,lon:-99.0719},
        {iata:"CUN",icao:"MMUN",name:"Cancún Intl",city:"Cancún",lat:21.0365,lon:-86.8770},
        {iata:"GRU",icao:"SBGR",name:"Guarulhos",city:"São Paulo",lat:-23.4356,lon:-46.4731},
        {iata:"GIG",icao:"SBGL",name:"Galeão",city:"Rio de Janeiro",lat:-22.8099,lon:-43.2505},
        {iata:"EZE",icao:"SAEZ",name:"Ezeiza",city:"Buenos Aires",lat:-34.8222,lon:-58.5358},
        {iata:"SCL",icao:"SCEL",name:"Santiago Intl",city:"Santiago",lat:-33.3930,lon:-70.7858},
        {iata:"BOG",icao:"SKBO",name:"El Dorado",city:"Bogotá",lat:4.7016,lon:-74.1469},
        {iata:"LIM",icao:"SPJC",name:"Jorge Chávez",city:"Lima",lat:-12.0219,lon:-77.1143}
      ];

      // `window.__airports` is the compact array-of-arrays payload from
      // airports.js (bundled OpenFlights, ~7,700 entries). We lazily convert
      // it to the same object shape as the inline fallback and cache the
      // result so the search + nearest-airport scan stay allocation-free
      // per keystroke.
      var __airportsFullCache = null;
      function getAirports() {
        if (__airportsFullCache) return __airportsFullCache;
        var raw = (typeof window !== "undefined") ? window.__airports : null;
        if (!raw || !raw.length) return AIRPORTS_FALLBACK;
        var out = new Array(raw.length);
        for (var i = 0; i < raw.length; i++) {
          var r = raw[i];
          out[i] = { iata: r[0] || "", icao: r[1] || "", name: r[2] || "", city: r[3] || "", country: r[4] || "", lat: r[5], lon: r[6] };
        }
        __airportsFullCache = out;
        return out;
      }
      if (typeof window !== "undefined") {
        window.addEventListener("airports-loaded", function () {
          __airportsFullCache = null;          // force re-convert on next call
          try { if (typeof updateTacReadout === "function") updateTacReadout(); } catch (e) {}
        });
      }

      // ==================== API SOURCES · REFRESH CADENCE ====================

      function adsbFiDirect(lat, lon, nm) {
        return "https://opendata.adsb.fi/api/v2/point/" + lat + "/" + lon + "/" + nm;
      }
      function adsbLolDirect(lat, lon, nm) {
        return "https://api.adsb.lol/v2/point/" + lat + "/" + lon + "/" + nm;
      }
      function openSkyDirect(lat, lon, nm) {
        var latN = parseFloat(lat), lonN = parseFloat(lon);
        var dLat = nm / 60;
        var dLon = nm / (60 * Math.max(0.01, Math.cos(latN * Math.PI / 180)));
        return "https://opensky-network.org/api/states/all" +
          "?lamin=" + (latN - dLat).toFixed(4) +
          "&lomin=" + (lonN - dLon).toFixed(4) +
          "&lamax=" + (latN + dLat).toFixed(4) +
          "&lomax=" + (lonN + dLon).toFixed(4);
      }
      function viaCorsProxy(innerUrl) {
        return "https://corsproxy.io/?url=" + encodeURIComponent(innerUrl);
      }
      function viaAllOrigins(innerUrl) {
        return "https://api.allorigins.win/raw?url=" + encodeURIComponent(innerUrl);
      }

      var API_SOURCES = [
        { name: "adsb.fi",             url: function (la, lo, nm) { return adsbFiDirect(la, lo, nm); },               parse: normalizeReadsb },
        { name: "adsb.lol",            url: function (la, lo, nm) { return adsbLolDirect(la, lo, nm); },              parse: normalizeReadsb },
        { name: "OpenSky",             url: function (la, lo, nm) { return openSkyDirect(la, lo, nm); },              parse: normalizeOpenSky },
        { name: "adsb.fi (proxy)",     url: function (la, lo, nm) { return viaCorsProxy(adsbFiDirect(la, lo, nm)); }, parse: normalizeReadsb },
        { name: "adsb.lol (proxy)",    url: function (la, lo, nm) { return viaCorsProxy(adsbLolDirect(la, lo, nm)); },parse: normalizeReadsb },
        { name: "OpenSky (proxy)",     url: function (la, lo, nm) { return viaCorsProxy(openSkyDirect(la, lo, nm)); },parse: normalizeOpenSky },
        { name: "adsb.fi (allorigins)",url: function (la, lo, nm) { return viaAllOrigins(adsbFiDirect(la, lo, nm)); },parse: normalizeReadsb }
      ];

      // Fast refresh for direct APIs (adsb.fi, adsb.lol); fallback rate for
      // CORS proxies and OpenSky, which have tighter limits. The active source
      // is recorded after every fetch; scheduleNext picks the right cadence.
      var REFRESH_MS_FAST = 10000;
      var REFRESH_MS_FALLBACK = 30000;
      function currentRefreshMs() {
        var src = state.activeSource || "";
        return /proxy|opensky/i.test(src) ? REFRESH_MS_FALLBACK : REFRESH_MS_FAST;
      }
      var NM_TO_KM = 1.852;

      // ==================== STATE · HELPERS · UI BUILDERS ====================

      var state = {
        center: { lat: PRESETS[0].lat, lon: PRESETS[0].lon, label: PRESETS[0].label, id: PRESETS[0].id },
        rangeNm: 50,
        planes: [],
        ships: {},
        tracks: {},
        shipTracks: {},
        historicalFetched: {},
        routes: {},
        selectedHex: null,
        selectedMmsi: null,
        selectedPlaneData: null, // authoritative render source for the selected plane (kept fresh by bulk fetch + pollSelected)
        lastPollSelectedAt: 0,   // ms timestamp of last pollSelected write; gates bulk-fetch overwrites of the selected plane's position
        trendMin: (function () {
          // Trend vector projection length in minutes. User-cyclable on the card: 5 → 2 → 1 → 5.
          try { var v = parseInt(localStorage.getItem("trend.minutes"), 10); if (v === 1 || v === 2 || v === 5) return v; } catch (e) {}
          return 5;
        })(),
        lastSelectedPlane: null, // grace-period snapshot after deselect so the marker doesn't disappear
        lastSelectedAt: 0,       // ms timestamp when lastSelectedPlane was set
        aircraftOwner: {}, // hex -> { operator, type, ... } from adsbdb.com, cached per selection
        airportLive: {},   // ICAO -> { apt } | null | "pending" — live-fetched fallback for fields not in bundled OpenFlights (e.g. small US GA like KSZP)
        aisMessageCount: 0,
        aisFirstMsgAt: 0,
        aisNoTrafficTimer: null,
        aisMsgTypes: {},         // { PositionReport: N, ShipStaticData: M, error: K, ... }
        aisLastMsgType: "",      // raw MessageType of the most recent frame
        aisLoggedSamples: 0,     // count of console.log'd sample messages (cap at 3)
        aisBbox: null,           // [[lat1,lon1],[lat2,lon2]] last-subscribed
        lastFetch: 0,
        lastError: null,
        fetching: false,
        refreshTimer: null,
        countdownTimer: null,
        nextFetchAt: 0,
        lastGeo: null,
        aisKey: null,
        aisSocket: null,
        aisReconnectTimer: null,
        aisReconnectAttempts: 0,
        // Contact-list filter + sort state, persisted in localStorage.
        listFilter: "all",        // "all" | "air" | "ground" | "mil" | "notable" | "emerg"
        listSort: "dist",         // "dist" | "alt" | "spd" | "call"
        listSortDesc: false,
        // Altitude range filter (ft) — applies to the radar AND the list,
        // stacked with the filter chip. Default 0 / ALT_MAX_FT = "off".
        altMinFt: 0,
        altMaxFt: 50000,          // also the slider ceiling; planes > 50k pass when at max
        shipFilter: "all",        // "all" | "underway" | "anchored" | "distress"
        shipSort: "dist",         // "dist" | "spd" | "name"
        shipSortDesc: false,
        // Base map tile source. Satellite default; VFR/IFR charts are
        // opt-in via the settings-panel picker. US-only for non-satellite
        // layers (ChartBundle serves FAA public-domain charts).
        mapLayer: "satellite"     // "satellite" | "sectional" | "vfr-terminal" | "ifr-low" | "ifr-high"
      };
      try { state.aisKey = localStorage.getItem("aisstream.key") || null; } catch (e) {}
      try {
        state.listFilter = localStorage.getItem("list.filter") || "all";
        state.listSort = localStorage.getItem("list.sort") || "dist";
        state.listSortDesc = localStorage.getItem("list.sortDesc") === "1";
        var storedMin = parseInt(localStorage.getItem("list.altMin"), 10);
        var storedMax = parseInt(localStorage.getItem("list.altMax"), 10);
        if (isFinite(storedMin) && storedMin >= 0 && storedMin <= 50000) state.altMinFt = storedMin;
        if (isFinite(storedMax) && storedMax >= 0 && storedMax <= 50000 && storedMax >= state.altMinFt) state.altMaxFt = storedMax;
        state.shipFilter = localStorage.getItem("list.shipFilter") || "all";
        state.shipSort = localStorage.getItem("list.shipSort") || "dist";
        state.shipSortDesc = localStorage.getItem("list.shipSortDesc") === "1";
        var storedLayer = localStorage.getItem("map.layer");
        if (storedLayer === "satellite" || storedLayer === "sectional" ||
            storedLayer === "vfr-terminal" ||
            storedLayer === "ifr-low" || storedLayer === "ifr-high") {
          state.mapLayer = storedLayer;
        }
      } catch (e) {}
      state.military = {};  // hex -> true for military aircraft

      function refreshMilitary() {
        var urls = [
          "https://opendata.adsb.fi/api/v2/mil",
          "https://api.adsb.lol/v2/mil",
          viaCorsProxy("https://opendata.adsb.fi/api/v2/mil")
        ];
        tryPhotoUrls(urls, 0).then(function (data) {
          var arr = (data && (data.ac || data.aircraft)) || [];
          var next = {};
          for (var i = 0; i < arr.length; i++) {
            var a = arr[i];
            if (a && a.hex) next[a.hex.toLowerCase()] = true;
          }
          state.military = next;
          renderRadar();
        }).catch(function () {});
      }

      // MMSI country decode (Maritime Identification Digits — first 3 digits)
      var MID_COUNTRY = {
        201:"Albania",202:"Andorra",203:"Austria",204:"Azores",205:"Belgium",206:"Belarus",207:"Bulgaria",208:"Vatican",209:"Cyprus",210:"Cyprus",211:"Germany",212:"Cyprus",213:"Georgia",214:"Moldova",215:"Malta",216:"Armenia",218:"Germany",219:"Denmark",220:"Denmark",224:"Spain",225:"Spain",226:"France",227:"France",228:"France",229:"Malta",230:"Finland",231:"Faroe Islands",232:"UK",233:"UK",234:"UK",235:"UK",236:"Gibraltar",237:"Greece",238:"Croatia",239:"Greece",240:"Greece",241:"Greece",242:"Morocco",243:"Hungary",244:"Netherlands",245:"Netherlands",246:"Netherlands",247:"Italy",248:"Malta",249:"Malta",250:"Ireland",251:"Iceland",252:"Liechtenstein",253:"Luxembourg",254:"Monaco",255:"Madeira",256:"Malta",257:"Norway",258:"Norway",259:"Norway",261:"Poland",262:"Montenegro",263:"Portugal",264:"Romania",265:"Sweden",266:"Sweden",267:"Slovakia",268:"San Marino",269:"Switzerland",270:"Czech Republic",271:"Turkey",272:"Ukraine",273:"Russia",274:"North Macedonia",275:"Latvia",276:"Estonia",277:"Lithuania",278:"Slovenia",279:"Serbia",301:"Anguilla",303:"Alaska",304:"Antigua",305:"Antigua",306:"Curacao",307:"Aruba",308:"Bahamas",309:"Bahamas",310:"Bermuda",311:"Bahamas",312:"Belize",314:"Barbados",316:"Canada",319:"Cayman Islands",321:"Costa Rica",323:"Cuba",325:"Dominica",327:"Dominican Rep",329:"Guadeloupe",330:"Grenada",331:"Greenland",332:"Guatemala",334:"Honduras",336:"Haiti",338:"USA",339:"Jamaica",341:"St Kitts & Nevis",343:"St Lucia",345:"Mexico",347:"Martinique",348:"Montserrat",350:"Nicaragua",351:"Panama",352:"Panama",353:"Panama",354:"Panama",355:"Panama",356:"Panama",357:"Panama",358:"Puerto Rico",359:"El Salvador",361:"St Pierre",362:"Trinidad",364:"Turks & Caicos",366:"USA",367:"USA",368:"USA",369:"USA",370:"Panama",371:"Panama",372:"Panama",373:"Panama",374:"Panama",375:"St Vincent",376:"St Vincent",377:"St Vincent",378:"British Virgin Is",379:"US Virgin Is",401:"Afghanistan",403:"Saudi Arabia",405:"Bangladesh",408:"Bahrain",410:"Bhutan",412:"China",413:"China",414:"China",416:"Taiwan",417:"Sri Lanka",419:"India",422:"Iran",423:"Azerbaijan",425:"Iraq",428:"Israel",431:"Japan",432:"Japan",434:"Turkmenistan",436:"Kazakhstan",437:"Uzbekistan",438:"Jordan",440:"Korea",441:"Korea",443:"Palestine",445:"North Korea",447:"Kuwait",450:"Lebanon",451:"Kyrgyzstan",453:"Macao",455:"Maldives",457:"Mongolia",459:"Nepal",461:"Oman",463:"Pakistan",466:"Qatar",468:"Syria",470:"UAE",471:"UAE",472:"Tajikistan",473:"Yemen",475:"Yemen",477:"Hong Kong",478:"Bosnia",501:"Adelie Land",503:"Australia",506:"Myanmar",508:"Brunei",510:"Micronesia",511:"Palau",512:"New Zealand",514:"Cambodia",515:"Cambodia",516:"Christmas Is",518:"Cook Islands",520:"Fiji",523:"Cocos Is",525:"Indonesia",529:"Kiribati",531:"Laos",533:"Malaysia",536:"Mariana Is",538:"Marshall Is",540:"New Caledonia",542:"Niue",544:"Nauru",546:"French Polynesia",548:"Philippines",553:"Papua New Guinea",555:"Pitcairn Is",557:"Solomon Is",559:"American Samoa",561:"Samoa",563:"Singapore",564:"Singapore",565:"Singapore",566:"Singapore",567:"Thailand",570:"Tonga",572:"Tuvalu",574:"Vietnam",576:"Vanuatu",577:"Vanuatu",578:"Wallis & Futuna",601:"South Africa",603:"Angola",605:"Algeria",607:"St Paul",608:"Ascension",609:"Burundi",610:"Benin",611:"Botswana",612:"C African Rep",613:"Cameroon",615:"Congo",616:"Comoros",617:"Cape Verde",618:"Antarctica",619:"Ivory Coast",620:"Comoros",621:"Djibouti",622:"Egypt",624:"Ethiopia",625:"Eritrea",626:"Gabon",627:"Ghana",629:"Gambia",630:"Guinea-Bissau",631:"Equatorial Guinea",632:"Guinea",633:"Burkina Faso",634:"Kenya",635:"Antarctica",636:"Liberia",637:"Liberia",638:"South Sudan",642:"Libya",644:"Lesotho",645:"Mauritius",647:"Madagascar",649:"Mali",650:"Mozambique",654:"Mauritania",655:"Malawi",656:"Niger",657:"Nigeria",659:"Namibia",660:"Reunion",661:"Rwanda",662:"Sudan",663:"Senegal",664:"Seychelles",665:"St Helena",666:"Somalia",667:"Sierra Leone",668:"Sao Tome",669:"Swaziland",670:"Chad",671:"Togo",672:"Tunisia",674:"Tanzania",675:"Uganda",676:"DR Congo",677:"Tanzania",678:"Zambia",679:"Zimbabwe",701:"Argentina",710:"Brazil",720:"Bolivia",725:"Chile",730:"Colombia",735:"Ecuador",740:"UK (Falkland)",745:"Guiana",750:"Guyana",755:"Paraguay",760:"Peru",765:"Suriname",770:"Uruguay",775:"Venezuela"
      };
      function mmsiCountry(mmsi) {
        if (!mmsi) return "";
        var s = String(mmsi);
        if (s.length < 3) return "";
        return MID_COUNTRY[parseInt(s.substring(0, 3), 10)] || "";
      }

      var $ = function (id) { return document.getElementById(id); };

      var presetRow = $("presetRow");
      var latInput = $("latInput");
      var lonInput = $("lonInput");
      // Slider 0–100 maps logarithmically to 5–500 NM.
      var RANGE_MIN = 5;
      var RANGE_MAX = 500;
      function sliderToNm(v) {
        var t = v / 100;
        var nm = Math.exp(Math.log(RANGE_MIN) + t * (Math.log(RANGE_MAX) - Math.log(RANGE_MIN)));
        return Math.max(RANGE_MIN, Math.min(RANGE_MAX, Math.round(nm)));
      }
      function nmToSlider(nm) {
        nm = Math.max(RANGE_MIN, Math.min(RANGE_MAX, nm));
        var t = (Math.log(nm) - Math.log(RANGE_MIN)) / (Math.log(RANGE_MAX) - Math.log(RANGE_MIN));
        return t * 100;
      }
      var rangeInput = null;
      var rangeVal = null;
      var radarLoc = $("radarLoc");
      var radarCount = $("radarCount");
      var planeLayer = $("planeLayer");
      var selectedCard = $("selectedCard");
      if (selectedCard) {
        selectedCard.addEventListener("click", function (e) {
          var tgt = e.target && e.target.closest ? e.target : null;
          var btn = tgt && tgt.closest(".sel-close");
          if (btn) { e.preventDefault(); e.stopPropagation(); deselectAll(); return; }
        });
      }
      var liveDot = $("liveDot");
      var statusText = $("statusText");
      var refreshBtn = $("refreshBtn");
      var listContainer = $("listContainer");
      var r1lbl = $("r1lbl");
      var r2lbl = $("r2lbl");
      var r3lbl = $("r3lbl");

      function escapeHtml(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
          return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
        });
      }

      // Edge-fade overflow hint for horizontal scroll rows. Sets --ov-l / --ov-r
      // (0..1) on the row based on whether content continues past each edge.
      // CSS uses these to fade the appropriate side of the mask — signals
      // "there's more here, swipe this way" without a scrollbar.
      function updateOverflowHint(row) {
        var sw = row.scrollWidth, cw = row.clientWidth, sl = row.scrollLeft;
        var canLeft  = sl > 1 ? "1" : "0";
        var canRight = (sl + cw) < (sw - 1) ? "1" : "0";
        row.style.setProperty("--ov-l", canLeft);
        row.style.setProperty("--ov-r", canRight);
      }
      function installOverflowHints(container) {
        if (!container) return;
        var rows = container.matches && container.matches(".chip-row, .preset-row")
          ? [container]
          : Array.prototype.slice.call(container.querySelectorAll(".chip-row, .preset-row"));
        rows.forEach(function (row) {
          if (row.__ovHinted) { updateOverflowHint(row); return; }
          row.__ovHinted = true;
          updateOverflowHint(row);
          row.addEventListener("scroll", function () { updateOverflowHint(row); }, { passive: true });
          if (typeof ResizeObserver !== "undefined") {
            var ro = new ResizeObserver(function () { updateOverflowHint(row); });
            ro.observe(row);
          }
        });
      }
      window.addEventListener("resize", function () {
        document.querySelectorAll(".chip-row, .preset-row").forEach(updateOverflowHint);
      });

      function buildPresets() {
        presetRow.innerHTML = "";
        var geoBtn = document.createElement("button");
        geoBtn.type = "button";
        geoBtn.className = "preset preset-geo";
        geoBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" style="vertical-align:-2px;margin-right:6px"><circle cx="8" cy="8" r="5"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/></svg>GPS';
        geoBtn.addEventListener("click", useGeolocation);
        presetRow.appendChild(geoBtn);

        PRESETS.forEach(function (p) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "preset" + (state.center.id === p.id ? " active" : "");
          b.dataset.id = p.id;
          b.textContent = p.label;
          b.addEventListener("click", function () {
            state.center = { lat: p.lat, lon: p.lon, label: p.label, id: p.id };
            syncCoordInputs();
            markActivePreset();
            onCenterChanged();
          });
          presetRow.appendChild(b);
        });
        installOverflowHints(presetRow);
      }

      function markActivePreset() {
        var btns = presetRow.querySelectorAll(".preset[data-id]");
        for (var i = 0; i < btns.length; i++) {
          btns[i].classList.toggle("active", btns[i].dataset.id === state.center.id);
        }
      }

      function syncCoordInputs() {
        latInput.value = state.center.lat.toFixed(4);
        lonInput.value = state.center.lon.toFixed(4);
      }

      function readCoordInputs() {
        var la = parseFloat(latInput.value);
        var lo = parseFloat(lonInput.value);
        if (!isFinite(la) || !isFinite(lo)) return false;
        if (la < -90 || la > 90 || lo < -180 || lo > 180) return false;
        state.center = { lat: la, lon: lo, label: "Custom", id: "custom" };
        markActivePreset();
        return true;
      }

      function useGeolocation() {
        if (!navigator.geolocation) {
          setError("Geolocation isn't available in this browser.");
          return;
        }
        try { localStorage.removeItem("geo.declined"); } catch (e) {}
        setStatus("Acquiring GPS…");
        navigator.geolocation.getCurrentPosition(
          function (pos) {
            state.lastGeo = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            state.center = {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              label: "Current",
              id: "me"
            };
            syncCoordInputs();
            markActivePreset();
            onCenterChanged();
          },
          function (err) {
            if (err && err.code === 1) {
              try { localStorage.setItem("geo.declined", "true"); } catch (e) {}
            }
            setError("Location denied or unavailable.");
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      }

      function onCenterChanged() {
        state.selectedHex = null;
        renderSelected();
        renderTiles();
        fetchNow();
        // AIS subscription is bbox-scoped. Without this, tapping a preset
        // moves the ADS-B fetch but leaves AIS listening to the OLD bbox —
        // user pans to LA but the key is still subscribed to the initial
        // center, and no ships appear.
        resubscribeAis();
        // INOP sticker state tracks the new center's FAA coverage.
        updateInopStickers();
      }

      function setStatus(msg) {
        statusText.textContent = msg;
        liveDot.classList.remove("err");
      }
      function setError(msg) {
        statusText.textContent = msg;
        liveDot.classList.add("err");
      }

      function haversineNm(lat1, lon1, lat2, lon2) {
        var R = 6371;
        var toRad = Math.PI / 180;
        var dLat = (lat2 - lat1) * toRad;
        var dLon = (lon2 - lon1) * toRad;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c) / NM_TO_KM;
      }


      // ==================== NORMALIZERS · FETCH · TRACKS · OVERLAYS ====================

      function normalizeReadsb(raw) {
        var arr = (raw && (raw.ac || raw.aircraft)) || [];
        var out = [];
        for (var i = 0; i < arr.length; i++) {
          var a = arr[i];
          if (!a) continue;
          var lat = num(a.lat);
          var lon = num(a.lon);
          if (lat == null || lon == null) continue;
          var call = (a.flight || a.r || a.hex || "").toString().trim();
          var altRaw = a.alt_baro != null ? a.alt_baro : a.alt_geom;
          var isGround = altRaw === "ground" || a.ground === true;
          var altFt = typeof altRaw === "number" ? altRaw : null;
          var vertRate = num(a.baro_rate);
          if (vertRate == null) vertRate = num(a.geom_rate);
          out.push({
            hex: (a.hex || "").toLowerCase(),
            callsign: call || (a.hex || "——").toUpperCase(),
            registration: a.r || "",
            type: a.t || "",
            lat: lat,
            lon: lon,
            altFt: altFt,
            vertRate: vertRate,
            onGround: isGround,
            gsKt: num(a.gs),
            trackDeg: num(a.track),
            squawk: a.squawk || "",
            seen: num(a.seen)
          });
        }
        return out;
      }

      function normalizeOpenSky(raw) {
        var arr = (raw && raw.states) || [];
        var out = [];
        for (var i = 0; i < arr.length; i++) {
          var s = arr[i];
          if (!s) continue;
          var lat = num(s[6]);
          var lon = num(s[5]);
          if (lat == null || lon == null) continue;
          var altM = num(s[7]);
          var velMs = num(s[9]);
          var onGround = s[8] === true;
          var call = (s[1] || s[0] || "").toString().trim();
          var vertRate = num(s[11]);
          // OpenSky vertRate is m/s; convert to feet per minute (×196.85)
          if (vertRate != null) vertRate = Math.round(vertRate * 196.85);
          out.push({
            hex: (s[0] || "").toLowerCase(),
            callsign: call || (s[0] || "——").toUpperCase(),
            registration: "",
            type: "",
            lat: lat,
            lon: lon,
            altFt: altM != null ? Math.round(altM * 3.28084) : null,
            vertRate: vertRate,
            onGround: onGround,
            gsKt: velMs != null ? velMs * 1.94384 : null,
            trackDeg: num(s[10]),
            squawk: s[14] || "",
            seen: null
          });
        }
        return out;
      }

      function num(v) {
        if (v == null) return null;
        var n = typeof v === "number" ? v : parseFloat(v);
        return isFinite(n) ? n : null;
      }

      function fetchRoute(callsign) {
        if (!callsign) return;
        var c = callsign.trim().toUpperCase();
        if (!c || c.length < 3) return;
        if (state.routes[c]) return;
        state.routes[c] = { state: "loading" };
        var base = "https://api.adsbdb.com/v0/callsign/" + encodeURIComponent(c);
        var urls = [base, viaCorsProxy(base), viaAllOrigins(base)];
        tryPhotoUrls(urls, 0).then(function (data) {
          var r = data && data.response && data.response.flightroute;
          if (r && r.origin && r.destination) {
            state.routes[c] = {
              state: "ok",
              origin: { iata: r.origin.iata_code, icao: r.origin.icao_code, name: r.origin.name, lat: r.origin.latitude, lon: r.origin.longitude },
              destination: { iata: r.destination.iata_code, icao: r.destination.icao_code, name: r.destination.name, lat: r.destination.latitude, lon: r.destination.longitude }
            };
          } else {
            state.routes[c] = { state: "none" };
          }
          renderSelected();
          renderOverlays();
        }).catch(function () {
          state.routes[c] = { state: "error" };
        });
      }

      function accumulateTracks() {
        var now = Date.now();
        // pollSelected is authoritative for the selected plane's track while it's
        // actively polling — skip here so bulk-fetch positions don't flip-flop the
        // history against the hex-endpoint positions (the A-B-A-B artifact).
        var selFresh = state.selectedHex && (now - state.lastPollSelectedAt) < 6000;
        for (var i = 0; i < state.planes.length; i++) {
          var p = state.planes[i];
          if (!p.hex || p.lat == null || p.lon == null) continue;
          if (selFresh && p.hex === state.selectedHex) continue;
          var arr = state.tracks[p.hex] || (state.tracks[p.hex] = []);
          var last = arr.length ? arr[arr.length - 1] : null;
          if (last && Math.abs(last.lat - p.lat) < 0.0001 && Math.abs(last.lon - p.lon) < 0.0001) continue;
          arr.push({ lat: p.lat, lon: p.lon, t: now, alt: p.altFt });
          if (arr.length > 120) arr.shift();
        }
        // Prune tracks older than 10 min without updates to save memory
        var cutoff = now - 10 * 60 * 1000;
        var keys = Object.keys(state.tracks);
        for (var k = 0; k < keys.length; k++) {
          var hex = keys[k];
          var t = state.tracks[hex];
          if (!t.length || t[t.length - 1].t < cutoff) {
            if (hex !== state.selectedHex) delete state.tracks[hex];
          }
        }
      }

      function renderOverlays() {
        var trackLayer = document.getElementById("trackLayer");
        var routeLayer = document.getElementById("routeLayer");
        var vectorLayer = document.getElementById("vectorLayer");
        if (!trackLayer || !routeLayer || !vectorLayer) return;
        trackLayer.innerHTML = "";
        routeLayer.innerHTML = "";
        vectorLayer.innerHTML = "";
        if (!state.selectedHex) return;
        var sel = getSelectedPlane();
        if (!sel) return;
        var svgns = "http://www.w3.org/2000/svg";

        var track = state.tracks[state.selectedHex];
        if (track && track.length > 1) {
          // Skip any segment whose implied groundspeed exceeds 800 kt (sanity
          // cap above any civilian airliner) — OpenSky's tracks/all sometimes
          // returns stale waypoints from earlier flights for the same hex,
          // which otherwise draw as long lines zigzagging across the map.
          for (var j = 1; j < track.length; j++) {
            var pa = track[j - 1];
            var pb = track[j];
            if (pa.lat == null || pa.lon == null || pb.lat == null || pb.lon == null) continue;
            var dtSec = Math.max(1, ((pb.t || 0) - (pa.t || 0)) / 1000);
            var segNm = haversineNm(pa.lat, pa.lon, pb.lat, pb.lon);
            var impliedKt = (segNm / dtSec) * 3600;
            if (impliedKt > 800) continue;
            var a = project({ lat: pa.lat, lon: pa.lon });
            var b = project({ lat: pb.lat, lon: pb.lon });
            if (!isFinite(a.x) || !isFinite(a.y) || !isFinite(b.x) || !isFinite(b.y)) continue;
            var line = document.createElementNS(svgns, "line");
            line.setAttribute("x1", a.x.toFixed(2));
            line.setAttribute("y1", a.y.toFixed(2));
            line.setAttribute("x2", b.x.toFixed(2));
            line.setAttribute("y2", b.y.toFixed(2));
            line.setAttribute("stroke", "#5ce0ca");
            line.setAttribute("stroke-width", "1.4");
            line.setAttribute("stroke-linecap", "round");
            line.setAttribute("opacity", (0.2 + 0.8 * (j / track.length)).toFixed(2));
            trackLayer.appendChild(line);
          }
        }

        var route = state.routes[(sel.callsign || "").toUpperCase()];
        if (route && route.state === "ok" && route.origin.lat && route.destination.lat) {
          var cur = project({ lat: sel.lat, lon: sel.lon });
          var org = project({ lat: route.origin.lat, lon: route.origin.lon });
          var dst = project({ lat: route.destination.lat, lon: route.destination.lon });
          function drawRouteLine(p1, p2) {
            var ln = document.createElementNS(svgns, "line");
            ln.setAttribute("x1", p1.x.toFixed(2));
            ln.setAttribute("y1", p1.y.toFixed(2));
            ln.setAttribute("x2", p2.x.toFixed(2));
            ln.setAttribute("y2", p2.y.toFixed(2));
            ln.setAttribute("stroke", "#ff4ddb");
            ln.setAttribute("stroke-width", "1.2");
            ln.setAttribute("stroke-dasharray", "3 2");
            ln.setAttribute("opacity", "0.9");
            routeLayer.appendChild(ln);
          }
          drawRouteLine(org, cur);
          drawRouteLine(cur, dst);
          function drawAptMarker(p, label) {
            var sq = document.createElementNS(svgns, "rect");
            sq.setAttribute("x", (p.x - 2).toFixed(2));
            sq.setAttribute("y", (p.y - 2).toFixed(2));
            sq.setAttribute("width", "4");
            sq.setAttribute("height", "4");
            sq.setAttribute("fill", "#ff4ddb");
            sq.setAttribute("stroke", "rgba(7,12,21,0.9)");
            sq.setAttribute("stroke-width", "0.4");
            routeLayer.appendChild(sq);
            if (!label) return;
            var txt = document.createElementNS(svgns, "text");
            txt.setAttribute("x", (p.x + 3).toFixed(2));
            txt.setAttribute("y", (p.y - 3).toFixed(2));
            txt.setAttribute("font-size", "5");
            txt.setAttribute("fill", "#ff4ddb");
            txt.setAttribute("font-family", "ui-monospace, SF Mono, monospace");
            txt.setAttribute("font-weight", "700");
            txt.setAttribute("style", "paint-order:stroke;stroke:rgba(7,12,21,0.9);stroke-width:1;stroke-linejoin:round;");
            txt.textContent = label;
            routeLayer.appendChild(txt);
          }
          drawAptMarker(org, route.origin.iata || route.origin.icao || "");
          drawAptMarker(dst, route.destination.iata || route.destination.icao || "");
        }

        if (sel.trackDeg != null && sel.gsKt != null && !sel.onGround && sel.gsKt > 20) {
          // Trend vector: where the aircraft will be in state.trendMin min at
          // current groundspeed and track. User can cycle 5 / 2 / 1 via the
          // TREND chip on the selected card (persisted to localStorage).
          var curV = project({ lat: sel.lat, lon: sel.lon });
          var TREND_MIN = state.trendMin || 5;
          var distNm = sel.gsKt * (TREND_MIN / 60);
          var lenRU = distNm * (100 / state.rangeNm);
          var rad = sel.trackDeg * Math.PI / 180;
          var dx = Math.sin(rad) * lenRU;
          var dy = -Math.cos(rad) * lenRU;
          var v = document.createElementNS(svgns, "line");
          v.setAttribute("x1", curV.x.toFixed(2));
          v.setAttribute("y1", curV.y.toFixed(2));
          v.setAttribute("x2", (curV.x + dx).toFixed(2));
          v.setAttribute("y2", (curV.y + dy).toFixed(2));
          v.setAttribute("stroke", "#6eff9a");
          v.setAttribute("stroke-width", "1.2");
          v.setAttribute("stroke-linecap", "round");
          v.setAttribute("opacity", "0.9");
          vectorLayer.appendChild(v);
          // Small tick at the 5-min endpoint
          var tickLen = 1.5;
          var perpX = Math.cos(rad) * tickLen;
          var perpY = Math.sin(rad) * tickLen;
          var endTick = document.createElementNS(svgns, "line");
          endTick.setAttribute("x1", (curV.x + dx - perpX).toFixed(2));
          endTick.setAttribute("y1", (curV.y + dy - perpY).toFixed(2));
          endTick.setAttribute("x2", (curV.x + dx + perpX).toFixed(2));
          endTick.setAttribute("y2", (curV.y + dy + perpY).toFixed(2));
          endTick.setAttribute("stroke", "#6eff9a");
          endTick.setAttribute("stroke-width", "1.2");
          endTick.setAttribute("opacity", "0.9");
          vectorLayer.appendChild(endTick);
        }

        // Ship overlays (trail + trend vector) when a ship is selected
        if (state.selectedMmsi) {
          var s = state.ships[state.selectedMmsi];
          if (s && s.lat != null && s.lon != null) {
            var strack = state.shipTracks[state.selectedMmsi];
            if (strack && strack.length > 1) {
              for (var k = 1; k < strack.length; k++) {
                var sa = project({ lat: strack[k - 1].lat, lon: strack[k - 1].lon });
                var sb = project({ lat: strack[k].lat, lon: strack[k].lon });
                var sl = document.createElementNS(svgns, "line");
                sl.setAttribute("x1", sa.x.toFixed(2));
                sl.setAttribute("y1", sa.y.toFixed(2));
                sl.setAttribute("x2", sb.x.toFixed(2));
                sl.setAttribute("y2", sb.y.toFixed(2));
                sl.setAttribute("stroke", "#ffb347");
                sl.setAttribute("stroke-width", "1.2");
                sl.setAttribute("stroke-linecap", "round");
                sl.setAttribute("opacity", (0.2 + 0.8 * (k / strack.length)).toFixed(2));
                trackLayer.appendChild(sl);
              }
            }
            var sCog = s.cog != null ? s.cog : s.heading;
            if (sCog != null && s.sog != null && s.sog > 0.5) {
              var scur = project({ lat: s.lat, lon: s.lon });
              var sDistNm = s.sog * (5 / 60);
              var sLen = sDistNm * (100 / state.rangeNm);
              var sRad = sCog * Math.PI / 180;
              var sdx = Math.sin(sRad) * sLen;
              var sdy = -Math.cos(sRad) * sLen;
              var sv = document.createElementNS(svgns, "line");
              sv.setAttribute("x1", scur.x.toFixed(2));
              sv.setAttribute("y1", scur.y.toFixed(2));
              sv.setAttribute("x2", (scur.x + sdx).toFixed(2));
              sv.setAttribute("y2", (scur.y + sdy).toFixed(2));
              sv.setAttribute("stroke", "#ffd89c");
              sv.setAttribute("stroke-width", "1.1");
              sv.setAttribute("stroke-linecap", "round");
              sv.setAttribute("opacity", "0.9");
              vectorLayer.appendChild(sv);
            }
          }
        }
      }

      function fetchNow() {
        if (state.fetching) return;
        state.fetching = true;
        refreshBtn.disabled = true;
        setStatus("Fetching…");

        var lat = state.center.lat.toFixed(4);
        var lon = state.center.lon.toFixed(4);
        var dist = state.rangeNm;
        radarLoc.textContent = (state.center.label || "Custom") + " · " + dist + " NM";
        updateRangeLabels();

        fetchWithFallback(lat, lon, dist, 0).then(function (result) {
          state.planes = result.source.parse(result.data);
          state.planes.forEach(function (p) {
            p.distNm = haversineNm(state.center.lat, state.center.lon, p.lat, p.lon);
          });
          state.planes.sort(function (a, b) { return (a.distNm || 0) - (b.distNm || 0); });
          accumulateTracks();
          // Record active source so scheduleNext() picks the right cadence
          // (10 s for direct APIs, 30 s for CORS proxies / OpenSky).
          state.activeSource = result.source.name;
          // Seed dead-reckoning base from the just-fetched ground-truth
          // positions. Every 1 s tick advances p.lat/p.lon from these.
          var nowMs = Date.now();
          state.planes.forEach(function (p) {
            p.baseLat = p.lat;
            p.baseLon = p.lon;
            p.baseAt = nowMs;
          });
          // Keep the authoritative selected-plane snapshot fresh if the bulk
          // fetch caught it. Critical invariant: only overwrite positional
          // fields when the fresh record actually has finite lat/lon.
          // adsb.fi occasionally returns a record without positions during
          // transponder-mode transitions; a naive Object.assign would clobber
          // the previously-good lat/lon with undefined and the marker would
          // vanish until the /hex/{hex} fast-poll recovered it 5-10 s later.
          if (state.selectedHex) {
            // pollSelected (adsb.fi /hex/{hex} @ 5 s) is authoritative for the
            // selected plane's position. Skip bulk-fetch's position merge if it
            // wrote within the last 6 s — otherwise the two sources race and
            // produce the A-B-A-B flip-flop we saw in issue #14.
            var selFreshBulk = (nowMs - state.lastPollSelectedAt) < 6000;
            for (var spi = 0; spi < state.planes.length; spi++) {
              var fresh = state.planes[spi];
              if (fresh.hex !== state.selectedHex) continue;
              var target = state.selectedPlaneData || {};
              if (!selFreshBulk && isFinite(fresh.lat) && isFinite(fresh.lon)) {
                target.lat = fresh.lat;
                target.lon = fresh.lon;
                target.baseLat = fresh.lat;
                target.baseLon = fresh.lon;
                target.baseAt = nowMs;
              }
              // Non-positional fields (altitude, speed, heading, callsign metadata)
              // merge regardless — they don't cause visual jumps.
              ["altFt","gsKt","trackDeg","vertRate","callsign","registration","type","squawk","distNm","onGround","hex","flight"].forEach(function (k) {
                if (fresh[k] != null) target[k] = fresh[k];
              });
              state.selectedPlaneData = target;
              break;
            }
          }
          state.lastFetch = Date.now();
          state.lastError = null;
          renderAll();
          renderOverlays();
          var rateTag = (currentRefreshMs() / 1000) + "s";
          setStatus(formatRelative(0) + " · " + result.source.name + " · " + rateTag);
          scheduleNext();
        }).catch(function (err) {
          var reason;
          if (err && err.name === "AbortError") reason = "request timed out";
          else if (err && err.name === "TypeError") reason = "network or CORS blocked (try Wi-Fi, disable content blockers)";
          else if (err && err.message) reason = err.message;
          else reason = String(err);
          state.lastError = reason;
          setError("Couldn't load flights: " + reason);
          scheduleNext();
        }).then(function () {
          state.fetching = false;
          refreshBtn.disabled = false;
        });
      }

      function fetchWithFallback(lat, lon, dist, idx) {
        if (idx >= API_SOURCES.length) {
          return Promise.reject(new Error("all sources failed"));
        }
        var src = API_SOURCES[idx];
        var url = src.url(lat, lon, dist);
        return fetchTimeout(url, 12000).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status + " from " + src.name);
          return r.json();
        }).then(function (data) {
          return { data: data, source: src };
        }).catch(function (err) {
          if (idx + 1 < API_SOURCES.length) return fetchWithFallback(lat, lon, dist, idx + 1);
          throw err;
        });
      }

      function fetchTimeout(url, ms) {
        if (typeof AbortController === "undefined") {
          return fetch(url, { cache: "no-store" });
        }
        var ctl = new AbortController();
        var t = setTimeout(function () { ctl.abort(); }, ms);
        return fetch(url, { cache: "no-store", signal: ctl.signal })
          .then(function (r) { clearTimeout(t); return r; })
          .catch(function (e) { clearTimeout(t); throw e; });
      }

      function scheduleNext() {
        if (state.refreshTimer) clearTimeout(state.refreshTimer);
        var ms = currentRefreshMs();
        state.nextFetchAt = Date.now() + ms;
        state.refreshTimer = setTimeout(fetchNow, ms);
        startCountdown();
      }

      function startCountdown() {
        if (state.countdownTimer) clearInterval(state.countdownTimer);
        state.countdownTimer = setInterval(tickStatus, 1000);
      }

      function tickStatus() {
        if (state.fetching) return;
        if (state.lastError) return;
        var ageMs = Date.now() - state.lastFetch;
        var inMs = Math.max(0, state.nextFetchAt - Date.now());
        statusText.textContent = formatRelative(ageMs) + " · next " + Math.ceil(inMs / 1000) + "s";
      }

      function formatRelative(ms) {
        var s = Math.round(ms / 1000);
        if (s < 2) return "just now";
        if (s < 60) return s + "s ago";
        var m = Math.round(s / 60);
        return m + "m ago";
      }

      function updateRangeLabels() {
        var r = state.rangeNm;
        r1lbl.textContent = Math.round(r * 0.25);
        r2lbl.textContent = Math.round(r * 0.5);
        r3lbl.textContent = Math.round(r * 0.75) + " NM";
      }

      // ==================== TILES · MAP LAYERS · PROJECTION ====================

      function computeTileZoom(lat, rangeNm) {
        var rangeMeters = rangeNm * 1852 * 2;
        var radarPx = 200;
        var earth = 40075000;
        var latR = lat * Math.PI / 180;
        var z = Math.log2(earth * Math.max(0.1, Math.cos(latR)) * radarPx / (256 * rangeMeters));
        // Oversample on retina displays so each tile pixel ≈ each physical
        // screen pixel instead of being upscaled. This is the main fidelity
        // lever for approximating Google/Apple Maps look.
        var dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
        var hd = dpr > 1.5 ? 1 : 0;
        return Math.min(18, Math.max(3, Math.round(z) + hd));
      }

      // Available base-map layers. Satellite is the global default; VFR and
      // IFR chart layers are served by ChartBundle.com (FAA public-domain
      // tiles, US-only, CORS-clean, no API key). The URL builders live here
      // so renderTiles can swap sources without reshaping its loop. Labels
      // are only overlaid for satellite — the aeronautical charts have
      // airports / airspace / fixes already baked into the tile.
      var IMAGERY_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/";
      var LABELS_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/";
      // FAA's own aeronautical charts hosted on ArcGIS Online. The
      // AeronauticalInformationServices_FAA org publishes tiled raster
      // sectionals + IFR enroute charts at LOD 8–12 (per the service
      // metadata at <base>/<service>/MapServer?f=pjson). Same tile
      // pattern our satellite IMAGERY_URL uses: {z}/{y}/{x} (ArcGIS
      // scheme, y before x). No API key, CORS-clean (Esri's standard
      // for anonymous-read tile services). ChartBundle (prior source)
      // went offline; PR #30 confirmed direct + corsproxy both fail.
      // Rough FAA chart coverage bbox — CONUS + Alaska + Hawaii + US
      // territories. FAA's ArcGIS services only publish tiles inside
      // this region; requests outside return nothing useful. We check
      // state.center on every map re-center and use this to (a) show
      // an "OUT OF COVERAGE · US ONLY" banner instead of firing tile
      // requests that will all fail, (b) restore the INOP sticker on
      // the chart buttons so users know the layer won't work at their
      // current location. The box is intentionally generous at the
      // edges (includes ocean around Hawaii and bits of Mexico /
      // Canada airspace near the border) — tiles themselves return
      // nothing over non-US territory, so "in coverage" is a
      // necessary-not-sufficient signal; the real test is whether
      // tiles load. When they don't despite coverage=true, the
      // existing UNAVAILABLE banner kicks in.
      var FAA_COVERAGE = { minLat: 17, maxLat: 72, minLon: -180, maxLon: -65 };
      function isInFaaCoverage(lat, lon) {
        return lat >= FAA_COVERAGE.minLat && lat <= FAA_COVERAGE.maxLat
            && lon >= FAA_COVERAGE.minLon && lon <= FAA_COVERAGE.maxLon;
      }

      // FAA only publishes Terminal Area Charts (TACs) for ~35 specific
      // controlled-airspace metros, not all of the US. The tile service's
      // fullExtent covers a huge bbox but the cache only has real tiles
      // within ~30 NM of each listed primary airport; elsewhere it 404s.
      // Rather than fetching and failing, gate the VFR Terminal button up
      // front by nearest-TAC distance. List sourced from the FAA TAC
      // publication roster (2026 cycle); lat/lon are the primary airport
      // for each charted metro. Adding a new TAC = one row here.
      var TAC_CITIES = [
        { code: "ANC", lat: 61.17, lon: -149.99 },
        { code: "BOS", lat: 42.36, lon: -71.01 },
        { code: "DCA", lat: 38.85, lon: -77.04 }, // Baltimore-Washington
        { code: "CLT", lat: 35.21, lon: -80.94 },
        { code: "ORD", lat: 41.98, lon: -87.90 },
        { code: "CVG", lat: 39.05, lon: -84.67 },
        { code: "CLE", lat: 41.41, lon: -81.85 },
        { code: "COS", lat: 38.80, lon: -104.70 },
        { code: "CMH", lat: 39.99, lon: -82.89 },
        { code: "DFW", lat: 32.90, lon: -97.04 },
        { code: "DEN", lat: 39.86, lon: -104.67 },
        { code: "DTW", lat: 42.21, lon: -83.35 },
        { code: "HNL", lat: 21.32, lon: -157.92 },
        { code: "IAH", lat: 29.98, lon: -95.34 },
        { code: "JAX", lat: 30.49, lon: -81.69 },
        { code: "MCI", lat: 39.30, lon: -94.71 },
        { code: "LAS", lat: 36.08, lon: -115.15 },
        { code: "LAX", lat: 33.94, lon: -118.41 },
        { code: "MEM", lat: 35.04, lon: -89.98 },
        { code: "MIA", lat: 25.80, lon: -80.29 },
        { code: "MSP", lat: 44.88, lon: -93.22 },
        { code: "MSY", lat: 29.99, lon: -90.26 },
        { code: "JFK", lat: 40.64, lon: -73.78 },
        { code: "MCO", lat: 28.43, lon: -81.31 },
        { code: "PHL", lat: 39.87, lon: -75.24 },
        { code: "PHX", lat: 33.43, lon: -112.01 },
        { code: "PIT", lat: 40.49, lon: -80.23 },
        { code: "PDX", lat: 45.59, lon: -122.60 },
        { code: "SJU", lat: 18.44, lon: -66.00 },
        { code: "SLC", lat: 40.79, lon: -111.98 },
        { code: "SAN", lat: 32.73, lon: -117.19 },
        { code: "SFO", lat: 37.62, lon: -122.37 },
        { code: "SEA", lat: 47.45, lon: -122.31 },
        { code: "STL", lat: 38.75, lon: -90.37 },
        { code: "TPA", lat: 27.98, lon: -82.53 }
      ];
      // TAC charts cover ~30 NM radius; allow a small margin so someone
      // panned to the edge of a TAC still gets the chart. If nearest
      // TAC > this, no TAC tiles will load here.
      var TAC_PROXIMITY_NM = 40;
      // Beyond this radar range a TAC is too coarse to read usefully (
      // each min-LOD tile already spans ~9 NM, so at 30 NM we're rendering
      // 3 tiles across and losing fine detail). Tell the user to zoom
      // in rather than serving an unreadable chart.
      var TAC_MAX_RANGE_NM = 30;
      function nearestTacDistanceNm(lat, lon) {
        var min = Infinity;
        for (var i = 0; i < TAC_CITIES.length; i++) {
          var d = haversineNm(lat, lon, TAC_CITIES[i].lat, TAC_CITIES[i].lon);
          if (d < min) min = d;
        }
        return min;
      }
      // Returns { ok: true } or { ok: false, reason: "USER-FACING TEXT" }
      // for a given chart layer at the current radar center + range.
      // renderTiles uses this to short-circuit impossible requests;
      // updateInopStickers uses the same function so the sticker state
      // and the tile-status banner never disagree.
      function chartLayerAvailability(layerId, lat, lon, rangeNm) {
        if (layerId === "satellite") return { ok: true };
        if (!isInFaaCoverage(lat, lon)) {
          return { ok: false, code: "us-only", reason: "OUT OF COVERAGE · US ONLY" };
        }
        if (layerId === "vfr-terminal") {
          if (rangeNm > TAC_MAX_RANGE_NM) {
            return { ok: false, code: "range", reason: "ZOOM IN · USE UNDER " + TAC_MAX_RANGE_NM + " NM" };
          }
          if (nearestTacDistanceNm(lat, lon) > TAC_PROXIMITY_NM) {
            return { ok: false, code: "no-tac", reason: "NO TAC HERE · TRY A MAJOR METRO" };
          }
        }
        return { ok: true };
      }
      function updateInopStickers() {
        // INOP sticker reflects per-layer availability at the current
        // center + range. For Sectional/IFR layers that's just FAA
        // coverage; for VFR Terminal it additionally accounts for range
        // (too wide = unreadable) and TAC-city proximity (no chart at
        // this location). Called from renderTiles so range changes and
        // pan/preset changes all keep the stickers in sync with reality.
        var ids = ["sectional", "vfr-terminal", "ifr-low", "ifr-high"];
        for (var i = 0; i < ids.length; i++) {
          var btn = document.querySelector('.map-layer-option[data-map-layer="' + ids[i] + '"]');
          if (!btn) continue;
          var avail = chartLayerAvailability(ids[i], state.center.lat, state.center.lon, state.rangeNm);
          btn.classList.toggle("inop", !avail.ok);
          // data-inop-code drives the sticker's CSS `content` so the label
          // tells the user *why* it's INOP (US-only / <30 NM / no TAC)
          // instead of a generic "INOP".
          if (!avail.ok && avail.code) {
            btn.setAttribute("data-inop-code", avail.code);
          } else {
            btn.removeAttribute("data-inop-code");
          }
        }
      }
      var FAA_ARCGIS_BASE = "https://tiles.arcgis.com/tiles/ssFJjBXIUyZDrSYZ/arcgis/rest/services/";
      function faaArcgisUrl(service, z, x, y) {
        return FAA_ARCGIS_BASE + service + "/MapServer/tile/" + z + "/" + y + "/" + x;
      }
      var MAP_LAYERS = {
        "satellite": {
          label: "Satellite",
          url: function (z, x, y) { return IMAGERY_URL + z + "/" + y + "/" + x; },
          maxZoom: 18,
          hasLabels: true,
          attribution: "Esri, Maxar, Earthstar Geographics"
        },
        "sectional": {
          label: "VFR Sectional",
          url: function (z, x, y) { return faaArcgisUrl("VFR_Sectional", z, x, y); },
          minZoom: 8,
          maxZoom: 12,
          zoomBoost: 1,
          hasLabels: false,
          attribution: "VFR Sectional © FAA · ArcGIS Online · US only"
        },
        "vfr-terminal": {
          label: "VFR Terminal",
          url: function (z, x, y) { return faaArcgisUrl("VFR_Terminal", z, x, y); },
          // Terminal Area Charts are 1:250,000 vs Sectional's 1:500,000
          // (2× the detail density). Service metadata confirms the LOD
          // window sits deeper than Sectional: minLOD=10, maxLOD=12
          // (from VFR_Terminal/MapServer?f=pjson). Below z=10 the
          // service 404s every tile; the zoom clamp in renderTiles
          // keeps us inside that window regardless of radar range, so
          // wide views get the coarsest (z=10) tiles stretched instead
          // of failing outright.
          minZoom: 10,
          maxZoom: 12,
          zoomBoost: 1,
          hasLabels: false,
          attribution: "VFR Terminal Area Chart © FAA · ArcGIS Online · US only"
        },
        "ifr-low": {
          label: "IFR Low",
          url: function (z, x, y) { return faaArcgisUrl("IFR_AreaLow", z, x, y); },
          minZoom: 8,
          maxZoom: 12,
          zoomBoost: 1,
          hasLabels: false,
          attribution: "IFR Low Enroute © FAA · ArcGIS Online · US only"
        },
        "ifr-high": {
          label: "IFR High",
          url: function (z, x, y) { return faaArcgisUrl("IFR_High", z, x, y); },
          minZoom: 8,
          maxZoom: 12,
          zoomBoost: 1,
          hasLabels: false,
          attribution: "IFR High Enroute © FAA · ArcGIS Online · US only"
        }
      };
      function currentMapLayer() {
        return MAP_LAYERS[state.mapLayer] || MAP_LAYERS.satellite;
      }

      // Tile-load diagnostics. Populated by renderTiles + placeTile, read by
      // updateTileStatus to paint a user-visible banner when a non-default
      // map layer is failing (all tiles erroring out = black radar). Silent
      // when tiles load normally; only noisy when the user has a real
      // problem worth seeing.
      var tileLoadState = { layer: "satellite", requested: 0, loaded: 0, errored: 0, lastError: null, renderStartedAt: 0 };
      // Build a compact key=value diagnostic string that captures the exact
      // tile-load failure state: which layer, how many failed, the source
      // URL (including any CORS-proxy wrapper), the unwrapped inner URL,
      // the current radar center/range, timestamp, and a short UA hint.
      // Tapping the red tile-status banner copies this to the clipboard so
      // a user debugging on a phone can paste the diagnostic into chat
      // instead of screenshotting the banner (which CSS ellipsis clips).
      function buildTileDiag() {
        var s = tileLoadState || {};
        var raw = s.lastError || "";
        var innerMatch = raw.match(/[?&]url=([^&]+)/);
        var inner = innerMatch ? decodeURIComponent(innerMatch[1]) : raw;
        var c = state.center || {};
        var parts = [
          "layer=" + s.layer,
          "err=" + s.errored + "/" + s.requested,
          "src=" + raw,
          inner !== raw ? "inner=" + inner : null,
          "center=" + (c.lat != null ? c.lat.toFixed(4) : "?") + "," + (c.lon != null ? c.lon.toFixed(4) : "?"),
          "range=" + state.rangeNm + "NM",
          "t=" + new Date().toISOString(),
          "ua=" + (navigator.userAgent || "").replace(/\s+/g, " ").slice(0, 80)
        ];
        return parts.filter(Boolean).join(" ");
      }

      function setupTileStatusCopy() {
        var el = document.getElementById("tileStatus");
        if (!el) return;
        el.addEventListener("click", function () {
          if (!el.classList.contains("err")) return;
          var diag = buildTileDiag();
          function flash(msg) {
            el.textContent = msg;
            setTimeout(function () {
              if (el.classList.contains("err")) updateTileStatus();
            }, 1800);
          }
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(diag).then(
              function () { flash("DIAGNOSTIC COPIED"); },
              function () { console.log("[tile-diag]", diag); flash("COULDN'T COPY"); }
            );
          } else {
            console.log("[tile-diag]", diag);
            flash("CLIPBOARD UNAVAILABLE");
          }
        });
      }

      function updateTileStatus() {
        var el = document.getElementById("tileStatus");
        if (!el) return;
        var s = tileLoadState;
        var pending = s.requested - s.loaded - s.errored;
        var allFailed = s.requested > 0 && s.errored === s.requested;
        var someFailed = s.requested > 0 && s.errored > 0 && s.loaded === 0;
        if (s.layer === "satellite") { el.hidden = true; el.textContent = ""; return; }
        // Friendly label for the user-visible banner. Technical URL/path/
        // count lives in buildTileDiag() instead — surfaced only when the
        // user taps to copy the full diagnostic.
        var layerInfo = MAP_LAYERS[s.layer] || {};
        var friendlyName = (layerInfo.label || s.layer).toUpperCase();
        if (s.unavailable) {
          // Specific, layer-aware reason set by chartLayerAvailability
          // (VFR Terminal at wide range, VFR Terminal far from any TAC,
          // any chart outside FAA coverage). Distinct from the generic
          // UNAVAILABLE state, which only fires after N/N tile errors
          // and reads like a server-side failure.
          el.hidden = false;
          el.className = "tile-status err";
          el.textContent = friendlyName + " · " + (s.unavailableReason || "UNAVAILABLE");
          return;
        }
        if (allFailed || someFailed) {
          el.hidden = false;
          el.className = "tile-status err";
          el.textContent = friendlyName + " UNAVAILABLE · TAP FOR DETAILS";
        } else if (pending > 0) {
          el.hidden = false;
          el.className = "tile-status";
          el.textContent = friendlyName + " · LOADING…";
        } else {
          el.hidden = true;
          el.textContent = "";
        }
      }

      function renderTiles() {
        var tileLayer = document.getElementById("tileLayer");
        var labelLayer = document.getElementById("labelLayer");
        if (!tileLayer) return;
        tileLayer.innerHTML = "";
        if (labelLayer) labelLayer.innerHTML = "";
        var center = state.center;
        var layer = currentMapLayer();
        // Tile-load counters so a non-rendering chart layer surfaces a user-
        // visible diagnostic rather than a silent black radar. Reset each
        // render; placeTile's load/error handlers increment these and
        // updateTileStatus() writes a banner if too many fail.
        // Keep the INOP stickers in sync with whatever we're about to
        // try rendering — so range changes (rangeSlider + pinch) reflect
        // in the dropdown, not just preset/pan changes. Cheap: 4 DOM
        // queries + classList toggles per renderTiles call.
        updateInopStickers();
        // Per-layer availability check. For satellite this is always ok;
        // for chart layers this rolls up FAA coverage, range-too-wide,
        // and TAC-proximity (for vfr-terminal) into one decision. When
        // not ok, we skip the tile loop entirely and updateTileStatus
        // renders the specific reason — user sees "NO TAC HERE · TRY A
        // MAJOR METRO" or "ZOOM IN · USE UNDER 30 NM" instead of a
        // generic UNAVAILABLE after N/N tile errors.
        var avail = chartLayerAvailability(state.mapLayer, center.lat, center.lon, state.rangeNm);
        tileLoadState = {
          layer: state.mapLayer,
          requested: 0,
          loaded: 0,
          errored: 0,
          lastError: null,
          unavailable: !avail.ok,
          unavailableReason: avail.reason || null,
          renderStartedAt: Date.now()
        };
        if (tileLoadState.unavailable) {
          updateTileStatus();
          return;
        }
        // Chart layers have a publisher-defined LOD range (FAA's ArcGIS
        // tiles exist at z=8..12 only). Clamp both ends so we don't
        // request tiles the service will 404 on at very wide or very
        // close zoom. Below minZoom we render the coarsest available
        // tile stretched out (already blocky, not a regression); above
        // maxZoom we render the deepest tile upscaled.
        //
        // layer.zoomBoost is an extra over-request on top of the retina
        // hd adjustment baked into computeTileZoom. Used on chart
        // layers: FAA publishes full chart detail at each LOD level, so
        // z=8 tiles have fine lettering/airways compressed into a tile
        // that covers ~66 NM at mid-latitudes. Rendering those across
        // a wider radar amplifies MIXED-format JPEG artifacts. Pulling
        // the next deeper LOD gives each tile sharper underlying pixels;
        // the maxZoom clamp prevents runaway oversampling at close zoom.
        var rawZ = computeTileZoom(center.lat, state.rangeNm);
        var z = Math.max(layer.minZoom || 0, Math.min(layer.maxZoom, rawZ + (layer.zoomBoost || 0)));
        var n = Math.pow(2, z);
        var latRad = center.lat * Math.PI / 180;
        var centerTileX = (center.lon + 180) / 360 * n;
        var centerTileY = (1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n;
        var centerTileIntX = Math.floor(centerTileX);
        var centerTileIntY = Math.floor(centerTileY);

        var mPerPx = 40075000 * Math.max(0.1, Math.cos(latRad)) / (n * 256);
        var radarUnitPerMeter = 100 / (state.rangeNm * 1852);
        var scale = mPerPx * radarUnitPerMeter;
        var tileSize = 256 * scale;

        // Pre-load a buffer of tiles beyond the radar circle so short pans
        // don't hit the edge. 140 instead of 100 means ~40% buffer.
        // At HD oversampling each tile is smaller, so cap the grid higher.
        var halfGrid = Math.min(8, Math.ceil((140 + tileSize / 2) / tileSize));
        var svgns = "http://www.w3.org/2000/svg";
        var xlinkns = "http://www.w3.org/1999/xlink";

        function placeTile(parent, url, rx, ry, size) {
          var img = document.createElementNS(svgns, "image");
          // Tiny overlap (0.6 radar units) prevents hairline seams between
          // adjacent tiles on fractional-pixel rendering.
          var overlap = 0.6;
          img.setAttribute("x", (rx - overlap / 2).toFixed(3));
          img.setAttribute("y", (ry - overlap / 2).toFixed(3));
          img.setAttribute("width", (size + overlap).toFixed(3));
          img.setAttribute("height", (size + overlap).toFixed(3));
          // xMidYMid meet keeps aspect ratio 1:1 (avoids stretching blur).
          img.setAttribute("preserveAspectRatio", "xMidYMid slice");
          img.setAttributeNS(xlinkns, "href", url);
          img.setAttribute("href", url);
          // Suppress the Referer header on tile requests. ChartBundle (and
          // many free tile hosts) use hotlink protection that 403s requests
          // carrying a github.io referer; "no-referrer" drops the header
          // entirely so the tile loads as an unattributed image fetch.
          // Harmless for satellite/label tiles that don't check referers.
          img.setAttribute("referrerpolicy", "no-referrer");
          img.setAttribute("image-rendering", "optimizeQuality");
          tileLoadState.requested += 1;
          img.addEventListener("load", function () {
            img.classList.add("ready");
            tileLoadState.loaded += 1;
            updateTileStatus();
          });
          img.addEventListener("error", function () {
            img.remove();
            tileLoadState.errored += 1;
            tileLoadState.lastError = url;
            updateTileStatus();
          });
          parent.appendChild(img);
        }

        for (var dy = -halfGrid; dy <= halfGrid; dy++) {
          for (var dx = -halfGrid; dx <= halfGrid; dx++) {
            var tx = centerTileIntX + dx;
            var ty = centerTileIntY + dy;
            if (ty < 0 || ty >= n) continue;
            var wrappedTx = ((tx % n) + n) % n;
            var offX = (tx - centerTileX) * 256;
            var offY = (ty - centerTileY) * 256;
            var rx = offX * scale;
            var ry = offY * scale;
            // Cull only tiles that are fully outside the SVG viewBox (-110..110)
            // instead of the radar circle — we now render the full square with
            // a vignette masking the corners.
            if (rx + tileSize < -110 || rx > 110 || ry + tileSize < -110 || ry > 110) continue;

            placeTile(tileLayer, layer.url(z, wrappedTx, ty), rx, ry, tileSize);
            if (labelLayer && layer.hasLabels) {
              placeTile(labelLayer, LABELS_URL + z + "/" + ty + "/" + wrappedTx, rx, ry, tileSize);
            }
          }
        }
      }

      // Project lat/lon -> radar coords (viewBox is -100..100 for 0..rangeNm)
      function project(p) {
        var cLatRad = state.center.lat * Math.PI / 180;
        var dLat = p.lat - state.center.lat;
        // Normalize longitude delta across the antimeridian so routes that
        // cross the Pacific take the short way. Without this, project() sees
        // SFO (lon -122) → HND (lon +140) as a +262° eastward span and the
        // pink route line draws as if the flight were crossing the Atlantic.
        var dLon = p.lon - state.center.lon;
        if (dLon > 180) dLon -= 360;
        else if (dLon < -180) dLon += 360;
        var dyNm = dLat * 60;
        var dxNm = dLon * 60 * Math.cos(cLatRad);
        var scale = 100 / state.rangeNm;
        return { x: dxNm * scale, y: -dyNm * scale };
      }

      // Nearest-airport lookup over the full dataset. Returns { apt, distNm }
      // for the closest airport, or null if the dataset is still loading and
      // nothing within maxNm is in the fallback list.
      function nearestAirport(lat, lon, maxNm) {
        var list = getAirports();
        if (!list.length) return null;
        var best = null, bestD = Infinity;
        for (var i = 0; i < list.length; i++) {
          var a = list[i];
          if (!isFinite(a.lat) || !isFinite(a.lon)) continue;
          var d = haversineNm(lat, lon, a.lat, a.lon);
          if (d < bestD) { bestD = d; best = a; }
        }
        if (!best) return null;
        if (maxNm != null && bestD > maxNm) return null;
        return { apt: best, distNm: bestD };
      }

      function updateTacReadout() {
        var tr = document.getElementById("tacReadout");
        if (!tr) return;
        var shipCount = Object.keys(state.ships || {}).length;
        var contactLine = state.planes.length + (state.aisKey ? " / " + shipCount : "");
        var near = nearestAirport(state.center.lat, state.center.lon, 50);
        var head;
        if (near) {
          head = "NEAREST: " + (near.apt.iata || near.apt.icao);
        } else {
          head = "OPEN WATER";
        }
        tr.textContent = head + " · " + state.rangeNm + " NM · " + contactLine + " CONTACTS";
      }

      // Altitude band -> chevron count (sergeant-rank pattern behind the
      // triangle). Shape is the altitude channel; plane color stays the
      // interest channel (default / selected / military / emergency / ground).
      // Bands chosen at 10k intervals so typical airliner cruise (FL300+) sits
      // in the 3-chevron band, readily distinguishable from regional cruise.
      function altitudeChevronCount(altFt) {
        if (typeof altFt !== "number" || !isFinite(altFt)) return 0;
        if (altFt < 10000) return 0;  // approach / departure / GA
        if (altFt < 20000) return 1;  // low IFR, GA cruise
        if (altFt < 30000) return 2;  // regional cruise
        if (altFt < 40000) return 3;  // typical airliner cruise
        return 4;                      // long-haul / bizjet / military
      }

      // ==================== RADAR · LIST · SELECTED CARD ====================

      function renderRadar() {
        radarCount.textContent = state.planes.length;
        updateTacReadout();
        planeLayer.innerHTML = "";
        var svgns = "http://www.w3.org/2000/svg";

        // Render source of truth, in priority order:
        //   1. state.planes — bulk fetch snapshot for the current bbox
        //   2. state.selectedPlaneData — authoritative render for the selected
        //      plane. Replaces any duplicate in state.planes so the icon is
        //      drawn from a single source that stays populated between fetches.
        //   3. state.lastSelectedPlane — 30 s grace buffer after deselect so
        //      the marker doesn't pop off the map the instant the user dismisses.
        var planes = state.selectedHex
          ? state.planes.filter(function (p) { return p.hex !== state.selectedHex; })
          : state.planes.slice();
        if (state.selectedHex && state.selectedPlaneData) {
          planes.push(state.selectedPlaneData);
        }
        if (state.lastSelectedPlane && (Date.now() - state.lastSelectedAt) < 30000) {
          var h = state.lastSelectedPlane.hex;
          var dup = false;
          for (var lsi = 0; lsi < planes.length; lsi++) {
            if (planes[lsi].hex === h) { dup = true; break; }
          }
          if (!dup) planes.push(state.lastSelectedPlane);
        }

        planes.forEach(function (p) {
          // List filter also applies to the radar: hide planes that the
          // current filter chip rejects. The selected plane is always kept
          // (passesPlaneFilter short-circuits to true for selectedHex) so
          // the card↔map link never breaks when a filter would otherwise
          // hide the selection.
          if (!passesPlaneFilter(p)) return;
          var pt = project(p);
          if (!isFinite(pt.x) || !isFinite(pt.y)) {
            return;
          }
          // Off-box: the selected plane gets an edge chevron so the user
          // never loses track of it when they pan past the render box.
          // All other contacts still cull — otherwise the edges fill up
          // with markers for dozens of planes a user isn't watching.
          if (Math.abs(pt.x) > 120 || Math.abs(pt.y) > 120) {
            if (!(p.hex && p.hex === state.selectedHex)) return;
            var edgeScale = 120 / Math.max(Math.abs(pt.x), Math.abs(pt.y));
            var ex = pt.x * edgeScale;
            var ey = pt.y * edgeScale;
            var compassDeg = (Math.atan2(pt.x, -pt.y) * 180 / Math.PI + 360) % 360;
            var cards = ["N","NE","E","SE","S","SW","W","NW"];
            var card = cards[Math.round(compassDeg / 45) % 8];
            var distStr = p.distNm != null ? p.distNm.toFixed(0) + " NM " + card : card;
            var edgeLabel = (p.callsign || (p.hex || "").toUpperCase()) + " · " + distStr;
            var eg = document.createElementNS(svgns, "g");
            eg.setAttribute("data-hex", p.hex);
            eg.setAttribute("transform", "translate(" + ex.toFixed(2) + "," + ey.toFixed(2) + ")");
            eg.style.cursor = "pointer";
            var eHit = document.createElementNS(svgns, "circle");
            eHit.setAttribute("cx", "0"); eHit.setAttribute("cy", "0");
            eHit.setAttribute("r", "8"); eHit.setAttribute("fill", "transparent");
            eg.appendChild(eHit);
            var rotDeg = Math.atan2(pt.x, -pt.y) * 180 / Math.PI;
            var chev = document.createElementNS(svgns, "polygon");
            chev.setAttribute("points", "0,-4 3,2 -3,2");
            chev.setAttribute("fill", "var(--plane-selected)");
            chev.setAttribute("stroke", "#fff");
            chev.setAttribute("stroke-width", "0.6");
            chev.setAttribute("transform", "rotate(" + rotDeg.toFixed(1) + ")");
            eg.appendChild(chev);
            var lx = 0, ly = 10, tAnchor = "middle";
            if (ex >= 119) { lx = -5; ly = 1; tAnchor = "end"; }
            else if (ex <= -119) { lx = 5; ly = 1; tAnchor = "start"; }
            else if (ey <= -119) { ly = 10; tAnchor = "middle"; }
            else { ly = -5; tAnchor = "middle"; }
            var eText = document.createElementNS(svgns, "text");
            eText.setAttribute("x", lx.toString());
            eText.setAttribute("y", ly.toString());
            eText.setAttribute("fill", "var(--plane-selected)");
            eText.setAttribute("font-size", "5");
            eText.setAttribute("font-family", "ui-monospace, SFMono-Regular, Menlo, monospace");
            eText.setAttribute("text-anchor", tAnchor);
            eText.setAttribute("paint-order", "stroke");
            eText.setAttribute("stroke", "rgba(7,12,21,0.9)");
            eText.setAttribute("stroke-width", "0.8");
            eText.textContent = edgeLabel;
            eg.appendChild(eText);
            planeLayer.appendChild(eg);
            return;
          }

          var g = document.createElementNS(svgns, "g");
          var heading = p.trackDeg == null ? 0 : p.trackDeg;
          g.setAttribute("transform", "translate(" + pt.x.toFixed(2) + "," + pt.y.toFixed(2) + ") rotate(" + heading.toFixed(1) + ")");
          g.setAttribute("data-hex", p.hex);
          g.style.cursor = "pointer";

          var isSel = p.hex && p.hex === state.selectedHex;
          var isMil = state.military && state.military[p.hex] ? true : false;
          var sq = (p.squawk || "").toString();
          var isEmergency = (sq === "7500" || sq === "7600" || sq === "7700");
          var color = isEmergency ? "#ff5a5a"
            : p.onGround ? "var(--plane-ground)"
            : isSel ? "var(--plane-selected)"
            : isMil ? "#ff9e4a"
            : "var(--plane)";

          // tap hit area
          var hit = document.createElementNS(svgns, "circle");
          hit.setAttribute("cx", "0");
          hit.setAttribute("cy", "0");
          hit.setAttribute("r", "6");
          hit.setAttribute("fill", "transparent");
          g.appendChild(hit);

          if (p.onGround) {
            var c = document.createElementNS(svgns, "circle");
            c.setAttribute("cx", "0");
            c.setAttribute("cy", "0");
            c.setAttribute("r", "2");
            c.setAttribute("fill", color);
            c.setAttribute("stroke", "rgba(7,12,21,0.9)");
            c.setAttribute("stroke-width", "0.6");
            g.appendChild(c);
          } else {
            var path = document.createElementNS(svgns, "polygon");
            path.setAttribute("points", "0,-4.2 3,4.2 0,2.6 -3,4.2");
            path.setAttribute("fill", color);
            path.setAttribute("stroke", isSel ? "#fff" : "rgba(7,12,21,0.95)");
            path.setAttribute("stroke-width", isSel ? "0.6" : "0.5");
            path.setAttribute("stroke-linejoin", "round");
            g.appendChild(path);

            // Altitude chevrons — packed flush with the triangle's trailing
            // edge so the whole marker reads as one unit. Dark outer + colored
            // inner for contrast against satellite imagery.
            var chevCount = altitudeChevronCount(p.altFt);
            for (var ci = 1; ci <= chevCount; ci++) {
              var apexY = 2.8 + (ci * 1.4);
              var pts = "-1.8," + (apexY + 0.9).toFixed(2) + " 0," + apexY.toFixed(2) + " 1.8," + (apexY + 0.9).toFixed(2);
              var chevShadow = document.createElementNS(svgns, "polyline");
              chevShadow.setAttribute("points", pts);
              chevShadow.setAttribute("fill", "none");
              chevShadow.setAttribute("stroke", "rgba(7,12,21,0.95)");
              chevShadow.setAttribute("stroke-width", "1.4");
              chevShadow.setAttribute("stroke-linecap", "round");
              chevShadow.setAttribute("stroke-linejoin", "round");
              g.appendChild(chevShadow);
              var chev = document.createElementNS(svgns, "polyline");
              chev.setAttribute("points", pts);
              chev.setAttribute("fill", "none");
              chev.setAttribute("stroke", color);
              chev.setAttribute("stroke-width", "0.7");
              chev.setAttribute("stroke-linecap", "round");
              chev.setAttribute("stroke-linejoin", "round");
              g.appendChild(chev);
            }
          }

          if (isEmergency) {
            var ehalo = document.createElementNS(svgns, "circle");
            ehalo.setAttribute("cx", "0"); ehalo.setAttribute("cy", "0");
            ehalo.setAttribute("r", "6");
            ehalo.setAttribute("fill", "none");
            ehalo.setAttribute("stroke", "#ff5a5a");
            ehalo.setAttribute("stroke-width", "0.8");
            var anim1 = document.createElementNS(svgns, "animate");
            anim1.setAttribute("attributeName", "r");
            anim1.setAttribute("values", "5;10;5");
            anim1.setAttribute("dur", "1.6s");
            anim1.setAttribute("repeatCount", "indefinite");
            var anim2 = document.createElementNS(svgns, "animate");
            anim2.setAttribute("attributeName", "opacity");
            anim2.setAttribute("values", "1;0.15;1");
            anim2.setAttribute("dur", "1.6s");
            anim2.setAttribute("repeatCount", "indefinite");
            ehalo.appendChild(anim1); ehalo.appendChild(anim2);
            g.insertBefore(ehalo, g.firstChild);
          }
          if (isSel) {
            var halo = document.createElementNS(svgns, "circle");
            halo.setAttribute("cx", "0");
            halo.setAttribute("cy", "0");
            halo.setAttribute("r", "7.5");
            halo.setAttribute("fill", "none");
            halo.setAttribute("stroke", "var(--plane-selected)");
            halo.setAttribute("stroke-width", "0.6");
            halo.setAttribute("opacity", "0.6");
            g.insertBefore(halo, g.firstChild);
          }

          g.addEventListener("click", function () { selectPlane(p.hex); });
          planeLayer.appendChild(g);
        });
      }

      // Filter predicates. Keep the selected contact visible regardless of
      // the active filter so the card↔list link never feels broken.
      function passesPlaneFilter(p) {
        if (p.hex && p.hex === state.selectedHex) return true;
        // Chip filter.
        var okChip;
        switch (state.listFilter) {
          case "all":     okChip = true; break;
          case "air":     okChip = !p.onGround; break;
          case "ground":  okChip = !!p.onGround; break;
          case "mil":     okChip = !!(state.military && state.military[p.hex]); break;
          case "notable": okChip = !!matchNotableCallsign(p.callsign); break;
          case "emerg":   okChip = p.squawk === "7500" || p.squawk === "7600" || p.squawk === "7700"; break;
          default:        okChip = true;
        }
        if (!okChip) return false;
        // Altitude range filter (stacked). Skip when at default extremes.
        // Airborne planes with missing altitude always pass (null altFt
        // shouldn't vanish the marker — user can narrow chip to GROUND
        // if they want to exclude unknowns). Ground planes always pass
        // so the ALT slider doesn't conflict with the GROUND chip.
        if (p.onGround) return true;
        var altDefault = state.altMinFt === 0 && state.altMaxFt >= 50000;
        if (altDefault) return true;
        if (p.altFt == null || !isFinite(p.altFt)) return true;
        // altMax at 50000 means "no upper bound" — planes above 50k still pass.
        var upperOk = state.altMaxFt >= 50000 ? true : p.altFt <= state.altMaxFt;
        return p.altFt >= state.altMinFt && upperOk;
      }
      function planeSortCmp(a, b) {
        var dir = state.listSortDesc ? -1 : 1;
        function n(v, fallback) { return (v == null || isNaN(v)) ? fallback : v; }
        switch (state.listSort) {
          case "alt":  return dir * (n(a.altFt, -1) - n(b.altFt, -1));
          case "spd":  return dir * (n(a.gsKt, -1) - n(b.gsKt, -1));
          case "call": return dir * String(a.callsign || a.hex || "").localeCompare(String(b.callsign || b.hex || ""));
          case "dist":
          default:     return dir * (n(a.distNm, 1e9) - n(b.distNm, 1e9));
        }
      }
      function passesShipFilter(s) {
        if (state.selectedMmsi === s.mmsi) return true;
        switch (state.shipFilter) {
          case "all":      return true;
          case "underway": return (s.sog || 0) >= 0.5 && s.navStatus !== 1 && s.navStatus !== 5 && s.navStatus !== 6;
          case "anchored": return s.navStatus === 1 || s.navStatus === 5;   // at anchor / moored
          case "distress": return s.navStatus != null && !!NAV_STATUS_ALERT[s.navStatus];
          default:         return true;
        }
      }
      function shipSortCmp(a, b) {
        var dir = state.shipSortDesc ? -1 : 1;
        function n(v, fallback) { return (v == null || isNaN(v)) ? fallback : v; }
        switch (state.shipSort) {
          case "spd":  return dir * (n(a.sog, -1) - n(b.sog, -1));
          case "name": return dir * String(a.name || a.mmsi || "").localeCompare(String(b.name || b.mmsi || ""));
          case "dist":
          default:     return dir * (n(a.distNm, 1e9) - n(b.distNm, 1e9));
        }
      }

      function setListOption(key, value) {
        if (key === "filter") {
          state.listFilter = value;
          try { localStorage.setItem("list.filter", value); } catch (e) {}
        } else if (key === "sort") {
          if (state.listSort === value) {
            state.listSortDesc = !state.listSortDesc;
          } else {
            state.listSort = value;
            state.listSortDesc = (value === "alt" || value === "spd"); // default desc for numeric
          }
          try {
            localStorage.setItem("list.sort", state.listSort);
            localStorage.setItem("list.sortDesc", state.listSortDesc ? "1" : "0");
          } catch (e) {}
        } else if (key === "shipFilter") {
          state.shipFilter = value;
          try { localStorage.setItem("list.shipFilter", value); } catch (e) {}
        } else if (key === "shipSort") {
          if (state.shipSort === value) {
            state.shipSortDesc = !state.shipSortDesc;
          } else {
            state.shipSort = value;
            state.shipSortDesc = (value === "spd");
          }
          try {
            localStorage.setItem("list.shipSort", state.shipSort);
            localStorage.setItem("list.shipSortDesc", state.shipSortDesc ? "1" : "0");
          } catch (e) {}
        }
        renderListControls();
        renderList();
        // Filters now affect which planes/ships are drawn on the radar
        // (see passesPlaneFilter / passesShipFilter applied in the render
        // loops). Re-render the radar immediately so the chip tap feels
        // responsive; without this, the user waits up to 10 s for the
        // next bulk fetch before the change shows on the map.
        if (key === "filter" || key === "shipFilter") renderRadar();
      }

      function renderListControls() {
        var controls = document.getElementById("listControls");
        if (!controls) return;
        var planeFilters = [
          { k: "all", label: "ALL" },
          { k: "air", label: "FLYING" },
          { k: "ground", label: "GROUND" },
          { k: "mil", label: "MIL" },
          { k: "notable", label: "NOTABLE" },
          { k: "emerg", label: "EMERG" }
        ];
        var planeSorts = [
          { k: "dist", label: "DIST" },
          { k: "alt", label: "ALT" },
          { k: "spd", label: "SPD" },
          { k: "call", label: "A–Z" }
        ];
        var shipFilters = [
          { k: "all", label: "ALL" },
          { k: "underway", label: "UNDERWAY" },
          { k: "anchored", label: "ANCHORED" },
          { k: "distress", label: "DISTRESS" }
        ];
        var shipSorts = [
          { k: "dist", label: "DIST" },
          { k: "spd", label: "SPD" },
          { k: "name", label: "A–Z" }
        ];
        var parts = [];
        parts.push('<div class="chip-row" data-kind="plane-filter"><span class="chip-row-label">FILTER</span>' +
          planeFilters.map(function (f) {
            var active = state.listFilter === f.k ? " active" : "";
            return '<button class="chip' + active + '" data-k="' + f.k + '">' + f.label + '</button>';
          }).join("") + '</div>');
        // Chevron-band quick filter (ALL + 0-4 chevrons). Taps tween the
        // dual-thumb alt slider below to the band's edges.
        parts.push(renderAltBandRow());
        // Altitude range: dual-thumb slider + readout. Two overlaid range
        // inputs, a shared track behind, and a "fill" bar showing the
        // selected range. Extremes (0 / 50k) read as "ALL" = filter off.
        parts.push(renderAltRangeRow());
        parts.push('<div class="chip-row" data-kind="plane-sort"><span class="chip-row-label">SORT</span>' +
          planeSorts.map(function (s) {
            var active = state.listSort === s.k ? " active" : "";
            var arrow = state.listSort === s.k ? (state.listSortDesc ? " ↓" : " ↑") : "";
            return '<button class="chip' + active + '" data-k="' + s.k + '">' + s.label + arrow + '</button>';
          }).join("") + '</div>');
        if (state.aisKey) {
          parts.push('<div class="chip-row" data-kind="ship-filter"><span class="chip-row-label">SEA</span>' +
            shipFilters.map(function (f) {
              var active = state.shipFilter === f.k ? " active" : "";
              return '<button class="chip' + active + '" data-k="' + f.k + '">' + f.label + '</button>';
            }).join("") + '</div>');
          parts.push('<div class="chip-row" data-kind="ship-sort"><span class="chip-row-label">SORT</span>' +
            shipSorts.map(function (s) {
              var active = state.shipSort === s.k ? " active" : "";
              var arrow = state.shipSort === s.k ? (state.shipSortDesc ? " ↓" : " ↑") : "";
              return '<button class="chip' + active + '" data-k="' + s.k + '">' + s.label + arrow + '</button>';
            }).join("") + '</div>');
        }
        controls.innerHTML = parts.join("");
        controls.querySelectorAll(".chip-row").forEach(function (row) {
          var kind = row.dataset.kind;
          row.querySelectorAll(".chip").forEach(function (btn) {
            btn.addEventListener("click", function () {
              var k = btn.dataset.k;
              if (kind === "plane-filter") setListOption("filter", k);
              else if (kind === "plane-sort") setListOption("sort", k);
              else if (kind === "plane-alt-band") selectAltBand(k);
              else if (kind === "ship-filter") setListOption("shipFilter", k);
              else if (kind === "ship-sort") setListOption("shipSort", k);
            });
          });
        });
        wireAltRangeSlider();
        installOverflowHints(controls);
      }

      // Formats a ft value as an aviation flight level ("FL080" for 8,000 ft,
      // "FL380" for 38,000 ft). Hundreds of feet, zero-padded to 3 digits.
      // Matches ATC/pilot vocabulary better than "8k ft" on a flight radar.
      function formatFL(ft) {
        var fl = Math.round(ft / 100);
        var s = String(fl);
        while (s.length < 3) s = "0" + s;
        return "FL" + s;
      }
      function formatAltRangeText() {
        var lo = state.altMinFt, hi = state.altMaxFt;
        if (lo === 0 && hi >= 50000) return "ALL";
        if (lo === 0) return "≤ " + formatFL(hi);
        if (hi >= 50000) return "≥ " + formatFL(lo);
        return formatFL(lo) + "–" + formatFL(hi);
      }
      function renderAltRangeRow() {
        var active = !(state.altMinFt === 0 && state.altMaxFt >= 50000);
        return '<div class="chip-row alt-range-row' + (active ? " active" : "") + '" data-kind="plane-alt-range">' +
          '<span class="chip-row-label">ALT</span>' +
          '<div class="alt-range">' +
            '<div class="alt-range-track">' +
              '<div class="alt-range-fill" id="altRangeFill"></div>' +
            '</div>' +
            '<input type="range" class="alt-range-input alt-range-min" id="altMinInput" min="0" max="50000" step="500" value="' + state.altMinFt + '" aria-label="Minimum altitude in feet" />' +
            '<input type="range" class="alt-range-input alt-range-max" id="altMaxInput" min="0" max="50000" step="500" value="' + state.altMaxFt + '" aria-label="Maximum altitude in feet" />' +
          '</div>' +
          '<span class="alt-range-readout" id="altRangeReadout">' + formatAltRangeText() + '</span>' +
        '</div>';
      }

      // Altitude quick-filter: six chips keyed to the chevron-count bands
      // defined by altitudeChevronCount(). Tapping a chip tweens the
      // dual-thumb alt slider to the band edges; the underlying filter
      // state (altMinFt / altMaxFt) is the same storage path as the
      // slider, so the chip is a shortcut, not a parallel filter.
      var ALT_BANDS = {
        "all": [0, 50000],
        "0":   [0, 10000],
        "1":   [10000, 20000],
        "2":   [20000, 30000],
        "3":   [30000, 40000],
        "4":   [40000, 50000]
      };
      function altBandMatchKey(minFt, maxFt) {
        var keys = ["all", "0", "1", "2", "3", "4"];
        for (var i = 0; i < keys.length; i++) {
          var b = ALT_BANDS[keys[i]];
          if (b[0] === minFt && b[1] === maxFt) return keys[i];
        }
        return null;
      }
      function altBandIconSvg(n) {
        if (n === 0) {
          return '<svg viewBox="0 0 20 16" class="alt-band-icon" aria-hidden="true">' +
            '<line x1="5" y1="11" x2="15" y2="11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
          '</svg>';
        }
        var svg = '<svg viewBox="0 0 20 16" class="alt-band-icon" aria-hidden="true">';
        var bottomApex = 13;
        for (var i = 0; i < n; i++) {
          var apexY = bottomApex - i * 3;
          svg += '<polyline points="6,' + (apexY + 2) + ' 10,' + apexY + ' 14,' + (apexY + 2) + '" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>';
        }
        svg += '</svg>';
        return svg;
      }
      function renderAltBandRow() {
        var active = altBandMatchKey(state.altMinFt, state.altMaxFt);
        var chips = [
          { k: "all", label: "ALL", icon: "", aria: "All altitudes" },
          { k: "0",   label: "",    icon: altBandIconSvg(0), aria: "Below 10,000 ft" },
          { k: "1",   label: "",    icon: altBandIconSvg(1), aria: "10,000 to 20,000 ft" },
          { k: "2",   label: "",    icon: altBandIconSvg(2), aria: "20,000 to 30,000 ft" },
          { k: "3",   label: "",    icon: altBandIconSvg(3), aria: "30,000 to 40,000 ft" },
          { k: "4",   label: "",    icon: altBandIconSvg(4), aria: "Above 40,000 ft" }
        ];
        return '<div class="chip-row alt-band-row" data-kind="plane-alt-band">' +
          '<span class="chip-row-label">ALT BAND</span>' +
          chips.map(function (c) {
            var on = active === c.k ? " active" : "";
            return '<button class="chip alt-band-chip' + on + '" data-k="' + c.k + '" aria-label="' + c.aria + '">' +
              c.icon + (c.label ? '<span class="alt-band-txt">' + c.label + '</span>' : '') +
            '</button>';
          }).join("") +
        '</div>';
      }
      var altBandTweenRaf = 0;
      function tweenAltBand(targetMin, targetMax) {
        if (altBandTweenRaf) cancelAnimationFrame(altBandTweenRaf);
        var startMin = state.altMinFt;
        var startMax = state.altMaxFt;
        var t0 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
        var DUR = 180;
        var altMinInput = document.getElementById("altMinInput");
        var altMaxInput = document.getElementById("altMaxInput");
        function step(now) {
          var elapsed = now - t0;
          var t = Math.min(1, elapsed / DUR);
          var lo = Math.round((startMin + (targetMin - startMin) * t) / 500) * 500;
          var hi = Math.round((startMax + (targetMax - startMax) * t) / 500) * 500;
          state.altMinFt = lo;
          state.altMaxFt = hi;
          if (altMinInput) altMinInput.value = lo;
          if (altMaxInput) altMaxInput.value = hi;
          updateAltRangeUi();
          if (t < 1) {
            altBandTweenRaf = requestAnimationFrame(step);
            return;
          }
          altBandTweenRaf = 0;
          state.altMinFt = targetMin;
          state.altMaxFt = targetMax;
          if (altMinInput) altMinInput.value = targetMin;
          if (altMaxInput) altMaxInput.value = targetMax;
          updateAltRangeUi();
          try {
            localStorage.setItem("list.altMin", String(targetMin));
            localStorage.setItem("list.altMax", String(targetMax));
          } catch (err) {}
          updateAltBandChips();
          renderRadar();
          renderListEntries();
        }
        altBandTweenRaf = requestAnimationFrame(function (now) {
          step(now != null ? now : (performance.now ? performance.now() : Date.now()));
        });
      }
      function updateAltBandChips() {
        var activeKey = altBandMatchKey(state.altMinFt, state.altMaxFt);
        var row = document.querySelector('[data-kind="plane-alt-band"]');
        if (!row) return;
        var chips = row.querySelectorAll(".chip[data-k]");
        for (var i = 0; i < chips.length; i++) {
          chips[i].classList.toggle("active", chips[i].dataset.k === activeKey);
        }
      }
      function selectAltBand(band) {
        var target = ALT_BANDS[band];
        if (!target) return;
        tweenAltBand(target[0], target[1]);
      }
      function updateAltRangeUi() {
        var fill = document.getElementById("altRangeFill");
        var readout = document.getElementById("altRangeReadout");
        var row = document.querySelector('[data-kind="plane-alt-range"]');
        if (fill) {
          var loPct = state.altMinFt / 50000 * 100;
          var hiPct = state.altMaxFt / 50000 * 100;
          fill.style.left = loPct.toFixed(2) + "%";
          fill.style.width = Math.max(0, hiPct - loPct).toFixed(2) + "%";
        }
        if (readout) readout.textContent = formatAltRangeText();
        if (row) {
          var active = !(state.altMinFt === 0 && state.altMaxFt >= 50000);
          row.classList.toggle("active", active);
        }
        updateAltBandChips();
      }
      function wireAltRangeSlider() {
        var altMin = document.getElementById("altMinInput");
        var altMax = document.getElementById("altMaxInput");
        if (!altMin || !altMax) return;
        var STEP = 500;
        function onInput(e) {
          var lo = parseInt(altMin.value, 10);
          var hi = parseInt(altMax.value, 10);
          // Prevent crossover: if thumbs would cross, push the passive one
          // one step ahead of the dragged one (keeps a 500 ft minimum band).
          if (lo > hi - STEP) {
            if (e.target === altMin) { lo = hi - STEP; altMin.value = lo; }
            else { hi = lo + STEP; altMax.value = hi; }
          }
          state.altMinFt = Math.max(0, lo);
          state.altMaxFt = Math.min(50000, hi);
          try {
            localStorage.setItem("list.altMin", String(state.altMinFt));
            localStorage.setItem("list.altMax", String(state.altMaxFt));
          } catch (err) {}
          updateAltRangeUi();
          renderRadar();
          renderListEntries();
        }
        altMin.addEventListener("input", onInput);
        altMax.addEventListener("input", onInput);
        // Apply initial fill-bar position once the DOM exists.
        updateAltRangeUi();
      }

      function renderList() {
        renderListControls();
        renderListEntries();
      }

      // Renders just the list rows (planes + ships) into #listContainer,
      // leaving #listControls alone. Used by the altitude range slider
      // which must keep its inputs alive across drag events — rebuilding
      // the controls mid-drag replaces the input elements and the browser
      // aborts the drag.
      function renderListEntries() {
        var html = "";
        if (!state.aisKey) {
          html += '<div class="ships-hint">SHIPS DISABLED · add an aisstream.io key in settings to track vessels</div>';
        }
        var allShips = state.aisKey ? shipsInRange() : [];
        var ships = allShips.filter(passesShipFilter).slice().sort(shipSortCmp);
        var allPlanes = state.planes.slice();
        var planes = allPlanes.filter(passesPlaneFilter).sort(planeSortCmp);
        var totalContacts = planes.length + ships.length;
        // Header counts — "AIR · 87/146" shows filtered vs total so the
        // user sees at a glance how aggressive the current filter is.
        var countBits = [];
        countBits.push("AIR · " + planes.length + "/" + allPlanes.length);
        if (state.aisKey) countBits.push("SEA · " + ships.length + "/" + allShips.length);
        if (countBits.length) html += '<div class="list-count">' + countBits.join("  ·  ") + '</div>';
        if (totalContacts === 0) {
          html += '<div class="empty">NO CONTACTS MATCH FILTER</div>';
          listContainer.innerHTML = html;
          return;
        }
        html += '<div class="plane-list">';
        planes.forEach(function (p) {
          var alt = p.onGround ? "ground" : (p.altFt != null ? p.altFt.toLocaleString() + " ft" : "—");
          var spd = p.gsKt != null ? Math.round(p.gsKt) + " kt" : "—";
          var dist = p.distNm != null ? p.distNm.toFixed(1) + " NM" : "";
          var sel = (p.hex && p.hex === state.selectedHex) ? " selected" : "";
          html += '<div class="plane-row' + sel + '" data-kind="plane" data-id="' + escapeHtml(p.hex) + '">' +
            '<div class="pr-badge"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1.2 9 7l5.4 2.2v1.4L9 9.4l-.3 3.3 1.8 1.3v1L8 14.5l-2.5.5v-1l1.8-1.3L7 9.4 1.6 10.6V9.2L7 7z"/></svg></div>' +
            '<div class="pr-body">' +
              '<div class="pr-top">' +
                '<span class="pr-call">' + escapeHtml(p.callsign) + '</span>' +
                '<span class="pr-dist">' + escapeHtml(dist) + '</span>' +
              '</div>' +
              '<div class="pr-sub">AIR · ' + escapeHtml(alt) + ' · ' + escapeHtml(spd) + (p.type ? ' · ' + escapeHtml(p.type) : '') + '</div>' +
            '</div>' +
          '</div>';
        });
        ships.forEach(function (s) {
          var spd = s.sog != null ? s.sog.toFixed(1) + " kt" : "—";
          var cog = s.cog != null ? Math.round(s.cog) + "°" : "—";
          var dist = s.distNm != null ? s.distNm.toFixed(1) + " NM" : "";
          var sel = (state.selectedMmsi === s.mmsi) ? " selected" : "";
          var name = (s.name || ("MMSI " + s.mmsi)).toUpperCase();
          html += '<div class="plane-row' + sel + '" data-kind="ship" data-id="' + escapeHtml(s.mmsi) + '">' +
            '<div class="pr-badge ship"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 11h12l-1.5 3h-9zM4 4h8v6H4zM7 6h2v2H7z"/></svg></div>' +
            '<div class="pr-body">' +
              '<div class="pr-top">' +
                '<span class="pr-call">' + escapeHtml(name) + '</span>' +
                '<span class="pr-dist">' + escapeHtml(dist) + '</span>' +
              '</div>' +
              '<div class="pr-sub">SEA · ' + escapeHtml(spd) + ' · HDG ' + escapeHtml(cog) + (s.destination ? ' · ' + escapeHtml(s.destination) : '') + '</div>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';
        listContainer.innerHTML = html;
        var rows = listContainer.querySelectorAll(".plane-row");
        for (var i = 0; i < rows.length; i++) {
          (function (el) {
            el.addEventListener("click", function () {
              if (el.dataset.kind === "ship") selectShip(el.dataset.id);
              else selectPlane(el.dataset.id);
            });
          })(rows[i]);
        }
      }

      var CLOSE_BUTTON_HTML = '<button class="sel-close" type="button" aria-label="Close">✕</button>';
      function renderSelected() {
        if (state.selectedMmsi) {
          selectedCard.classList.remove("is-empty");
          var s = state.ships[state.selectedMmsi];
          if (!s) {
            selectedCard.classList.add("is-empty");
            selectedCard.innerHTML = CLOSE_BUTTON_HTML + '<div class="sel-empty">Selected vessel left the area</div>';
            return;
          }
          var sog = s.sog != null ? s.sog.toFixed(1) + " kt" : "—";
          var cog = s.cog != null ? Math.round(s.cog) + "°" : "—";
          var hdg = s.heading != null ? s.heading + "°" : "—";
          var dist = s.distNm != null ? s.distNm.toFixed(1) + " NM" : "—";
          var name = escapeHtml((s.name || "").toString().toUpperCase() || ("MMSI " + s.mmsi));
          var country = mmsiCountry(s.mmsi);
          var navText = navStatusText(s.navStatus);
          var shipAlerts = "";
          if (s.navStatus != null && NAV_STATUS_ALERT[s.navStatus]) {
            shipAlerts = '<div class="sel-alert emerg">⚠ NAV · ' + escapeHtml(navText || ("STATUS " + s.navStatus)) + '</div>';
          }
          var navLine = navText
            ? '<div class="sel-route sel-route-empty">NAV STATUS · ' + escapeHtml(navText) + '</div>'
            : '';
          selectedCard.innerHTML =
            CLOSE_BUTTON_HTML +
            '<div class="sel-head">' +
              '<div class="sel-head-row">' +
                '<span class="sel-call">' + name + '</span>' +
              '</div>' +
              '<span class="sel-reg">MMSI ' + escapeHtml(s.mmsi) + (country ? ' · ' + escapeHtml(country) : '') + '</span>' +
            '</div>' +
            shipAlerts +
            navLine +
            (s.destination ? '<div class="sel-route sel-route-empty">DEST · ' + escapeHtml(s.destination) + '</div>' : '') +
            '<div class="sel-grid">' +
              '<div class="sel-cell"><span class="k">SOG</span><span class="v">' + escapeHtml(sog) + '</span></div>' +
              '<div class="sel-cell"><span class="k">COG</span><span class="v">' + escapeHtml(cog) + '</span></div>' +
              '<div class="sel-cell"><span class="k">Heading</span><span class="v">' + escapeHtml(hdg) + '</span></div>' +
              '<div class="sel-cell"><span class="k">Distance</span><span class="v">' + escapeHtml(dist) + '</span></div>' +
              '<div class="sel-cell"><span class="k">Lat</span><span class="v">' + (s.lat != null ? s.lat.toFixed(3) : "—") + '</span></div>' +
              '<div class="sel-cell"><span class="k">Lon</span><span class="v">' + (s.lon != null ? s.lon.toFixed(3) : "—") + '</span></div>' +
            '</div>';
          return;
        }
        if (!state.selectedHex) {
          selectedCard.classList.add("is-empty");
          selectedCard.innerHTML = '<div class="sel-empty">Tap a contact to see details</div>';
          return;
        }
        // Look up selected plane from bulk fetch first, sticky snapshot second.
        var p = null;
        for (var spi = 0; spi < state.planes.length; spi++) {
          if (state.planes[spi].hex === state.selectedHex) { p = state.planes[spi]; break; }
        }
        if (!p) p = state.selectedPlaneData;
        if (p) {
          selectedCard.classList.remove("is-empty");
          renderSelectedPlaneCard(p);
          return;
        }
        selectedCard.classList.add("is-empty");
        selectedCard.innerHTML = CLOSE_BUTTON_HTML + '<div class="sel-empty">Acquiring…</div>';
        return;
      }

      function renderSelectedPlaneCard(p) {
        var alt = p.onGround ? "Ground" : (p.altFt != null ? p.altFt.toLocaleString() + " ft" : "—");
        var spd = p.gsKt != null ? Math.round(p.gsKt) + " kt" : "—";
        var hdg = p.trackDeg != null ? Math.round(p.trackDeg) + "°" : "—";
        var dist = p.distNm != null ? p.distNm.toFixed(1) + " NM" : "—";
        var typ = p.type || "—";
        var sq  = p.squawk || "—";
        var hexLower = (p.hex || "").toLowerCase();
        var hexUpper = (p.hex || "").toUpperCase();
        var callsign = (p.callsign || "").toString();
        var headline = callsign || hexUpper;
        // Suppress the small-line registration when it would just duplicate the
        // headline (e.g. private planes whose callsign is their N-number).
        var reg = "";
        if (p.registration) {
          var regRaw = String(p.registration);
          if (regRaw.toUpperCase() !== headline.toUpperCase()) reg = escapeHtml(regRaw);
        }
        var statusRowHtml = renderLoadingRow(hexLower, callsign.toUpperCase());
        var photoHtml = renderPhotoBlock(p.hex);
        var routeHtml = renderRouteBlock(callsign.toUpperCase());
        // Banners: emergency, military, notable (curated + operator), anomalies
        var alertsHtml = "";
        var sq2 = sq.toString();
        var emLabel = sq2 === "7500" ? "HIJACK" : sq2 === "7600" ? "RADIO FAIL" : sq2 === "7700" ? "EMERGENCY" : "";
        if (emLabel) alertsHtml += '<div class="sel-alert emerg">⚠ ' + emLabel + ' · SQUAWK ' + escapeHtml(sq2) + '</div>';
        if (state.military && state.military[hexLower]) alertsHtml += '<div class="sel-alert mil">MIL · TRACKED AS MILITARY</div>';
        var notable = callsign ? matchNotableCallsign(callsign) : null;
        if (notable) {
          alertsHtml += '<div class="sel-alert notable">NOTABLE · ' + escapeHtml(notable.label) + '</div>';
        } else if (state.aircraftOwner[hexLower] && state.aircraftOwner[hexLower].label) {
          alertsHtml += '<div class="sel-alert notable">NOTABLE · ' + escapeHtml(state.aircraftOwner[hexLower].label) + '</div>';
        }
        var anomaliesHtml = renderAnomalyChips(p);
        var subtitle = reg + (reg && typ !== "—" ? " · " : "") + (typ !== "—" ? escapeHtml(typ) : "");
        selectedCard.innerHTML =
          // Top strip (TRACK + ✕ inline) — close button lives inside
          // statusRowHtml so it aligns with the TRACK line vertically.
          statusRowHtml +
          '<div class="sel-head">' +
            '<span class="sel-call">' + escapeHtml(headline) + '</span>' +
            (subtitle ? '<span class="sel-reg">' + subtitle + '</span>' : '') +
          '</div>' +
          alertsHtml +
          anomaliesHtml +
          routeHtml +
          photoHtml +
          '<div class="sel-grid">' +
            '<div class="sel-cell"><span class="k">Altitude</span><span class="v">' + escapeHtml(alt) + '</span></div>' +
            '<div class="sel-cell"><span class="k">Speed</span><span class="v">' + escapeHtml(spd) + '</span></div>' +
            '<div class="sel-cell"><span class="k">Heading</span><span class="v">' + escapeHtml(hdg) + '</span></div>' +
            '<div class="sel-cell"><span class="k">Distance</span><span class="v">' + escapeHtml(dist) + '</span></div>' +
            '<div class="sel-cell"><span class="k">Squawk</span><span class="v">' + escapeHtml(sq) + '</span></div>' +
            '<div class="sel-cell"><span class="k">Hex</span><span class="v">' + escapeHtml(hexUpper) + '</span></div>' +
          '</div>';
      }

      // --- loading-row helpers ---
      // Emits the top strip of the selected-plane card: TRACK summary on
      // the left, ✕ close button on the right. ROUTE used to live here too
      // but was removed because it's already shown in the pink sel-route
      // line below the callsign — no need to duplicate. The close button
      // is inline (not absolutely positioned) so it sits in a predictable
      // row beside the TRACK text.
      function renderLoadingRow(hex, callsign) {
        var trackStatus = trackStatusText(hex);
        function seg(label, value, loading) {
          return '<span class="ld-seg' + (loading ? " loading" : "") + '"><span class="ld-k">' + label + '</span>' +
                 (loading ? '<span class="ld-dot"></span>' : '') +
                 '<span class="ld-v">' + escapeHtml(value) + '</span></span>';
        }
        return '<div class="sel-top-row">' +
          '<div class="loading-row">' +
            seg("TRACK", trackStatus.text, trackStatus.loading) +
          '</div>' +
          CLOSE_BUTTON_HTML +
        '</div>';
      }
      function trackStatusText(hex) {
        if (!hex) return { text: "—", loading: false };
        var t = state.tracks[hex];
        var fetched = state.historicalFetched[hex];
        if (!fetched) return { text: "LOADING HISTORY…", loading: true };
        if (!t || t.length < 2) return { text: "LIVE ONLY", loading: false };
        var first = t[0], last = t[t.length - 1];
        var minutes = Math.max(1, Math.round((last.t - first.t) / 60000));
        return { text: t.length + " PTS · " + minutes + " MIN", loading: false };
      }
      function routeStatusText(callsign) {
        if (!callsign) return { text: "—", loading: false };
        var r = state.routes[callsign];
        if (!r) return { text: "—", loading: false };
        if (r.state === "loading") return { text: "LOOKING UP…", loading: true };
        if (r.state === "ok") {
          var oCode = r.origin.iata || r.origin.icao || "?";
          var dCode = r.destination.iata || r.destination.icao || "?";
          return { text: oCode + " → " + dCode, loading: false };
        }
        return { text: "NOT FOUND", loading: false };
      }
      function photoStatusText(hex) {
        if (!hex) return { text: "—", loading: false };
        var c = photoCache[hex.toLowerCase()];
        if (!c) return { text: "—", loading: false };
        if (c.state === "loading") return { text: "LOADING…", loading: true };
        if (c.state === "ok") return { text: "VIA PLANESPOTTERS", loading: false };
        if (c.state === "none") return { text: "NONE AVAILABLE", loading: false };
        return { text: "UNAVAILABLE", loading: false };
      }

      // LEAD pill — persistent collapsed pill below the radar shows the
      // current value. Tapping expands it to the 3-option segmented picker;
      // tapping an option sets + collapses. LEAD is the aviation/weapons-
      // systems term for a projected intercept position (chosen over
      // "TREND" to avoid confusion with the TRAIL = actual flown path).
      function syncLeadPicker() {
        var tm = state.trendMin || 5;
        var picker = document.getElementById("leadPicker");
        if (picker) {
          var btns = picker.querySelectorAll("[data-trend-min]");
          for (var i = 0; i < btns.length; i++) {
            var m = parseInt(btns[i].getAttribute("data-trend-min"), 10);
            var isActive = (m === tm);
            btns[i].classList.toggle("active", isActive);
            if (isActive) btns[i].setAttribute("aria-pressed", "true");
            else btns[i].removeAttribute("aria-pressed");
          }
        }
        var val = document.getElementById("leadPillValue");
        if (val) val.textContent = String(tm);
      }

      // Called when any LEAD segmented button is tapped. Jumps directly
      // to the requested length (1, 2, or 5 min) and persists.
      function setTrendMin(n) {
        var v = parseInt(n, 10);
        if (v !== 1 && v !== 2 && v !== 5) return;
        if (state.trendMin === v) return;
        state.trendMin = v;
        try { localStorage.setItem("trend.minutes", String(v)); } catch (e) {}
        syncLeadPicker();
        renderOverlays();
        renderSelected();
      }

      // Map-layer control — pill below the radar opens a dropdown with
      // Satellite + VFR / IFR-Low / IFR-High. Chart layers render with an
      // INOP pilot-sticker overlay (CSS only) until the tile source can be
      // verified against the user's network. Picking a chart layer still
      // applies it — the tile-fail banner surfaces the failure.
      function syncMapLayerPicker() {
        var label = document.getElementById("mapLayerLabel");
        if (label) label.textContent = (MAP_LAYERS[state.mapLayer] || MAP_LAYERS.satellite).label;
        var dd = document.getElementById("mapLayerDropdown");
        if (!dd) return;
        var opts = dd.querySelectorAll("[data-map-layer]");
        for (var i = 0; i < opts.length; i++) {
          var isActive = opts[i].getAttribute("data-map-layer") === state.mapLayer;
          opts[i].classList.toggle("active", isActive);
          if (isActive) opts[i].setAttribute("aria-selected", "true");
          else opts[i].removeAttribute("aria-selected");
        }
      }
      function setMapLayer(v) {
        if (!MAP_LAYERS[v]) return;
        if (state.mapLayer === v) return;
        state.mapLayer = v;
        try { localStorage.setItem("map.layer", v); } catch (e) {}
        syncMapLayerPicker();
        var el = document.getElementById("tileStatus");
        if (el) { el.hidden = true; el.textContent = ""; }
        renderTiles();
        updateAttributionFooter();
      }
      function closeMapLayerDropdown() {
        var pill = document.getElementById("mapLayerPill");
        var dd = document.getElementById("mapLayerDropdown");
        if (pill) pill.setAttribute("aria-expanded", "false");
        if (dd) dd.hidden = true;
      }
      function openMapLayerDropdown() {
        var pill = document.getElementById("mapLayerPill");
        var dd = document.getElementById("mapLayerDropdown");
        if (pill) pill.setAttribute("aria-expanded", "true");
        if (dd) dd.hidden = false;
      }
      function setupMapLayerPicker() {
        var pill = document.getElementById("mapLayerPill");
        var dd = document.getElementById("mapLayerDropdown");
        if (!pill || !dd) return;
        pill.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (pill.getAttribute("aria-expanded") === "true") closeMapLayerDropdown();
          else openMapLayerDropdown();
        });
        dd.addEventListener("click", function (e) {
          var tgt = e.target && e.target.closest ? e.target.closest("[data-map-layer]") : null;
          if (!tgt) return;
          e.preventDefault();
          setMapLayer(tgt.getAttribute("data-map-layer"));
          closeMapLayerDropdown();
        });
        document.addEventListener("click", function (e) {
          if (pill.getAttribute("aria-expanded") !== "true") return;
          if (e.target.closest && e.target.closest("#mapLayerControl")) return;
          closeMapLayerDropdown();
        });
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && pill.getAttribute("aria-expanded") === "true") closeMapLayerDropdown();
        });
        syncMapLayerPicker();
      }

      // Attribution footer updates to reflect the active base-map source so
      // we stay compliant with ESRI / ChartBundle / FAA attribution terms.
      function updateAttributionFooter() {
        var footer = document.querySelector(".page-footer");
        if (!footer) return;
        var layer = currentMapLayer();
        var base = layer.attribution;
        var rest = "Flight data: adsb.fi / adsb.lol / OpenSky · Photos: planespotters.net · Routes: adsbdb.com · AIS: aisstream.io";
        footer.textContent = "Imagery © " + base + " · " + rest;
      }

      function collapseLeadPill() {
        var pill = document.getElementById("leadPill");
        var trig = document.getElementById("leadPillTrigger");
        if (pill) pill.setAttribute("data-state", "collapsed");
        if (trig) trig.setAttribute("aria-expanded", "false");
      }
      function expandLeadPill() {
        var pill = document.getElementById("leadPill");
        var trig = document.getElementById("leadPillTrigger");
        if (pill) pill.setAttribute("data-state", "expanded");
        if (trig) trig.setAttribute("aria-expanded", "true");
      }
      function setupLeadPicker() {
        var pill = document.getElementById("leadPill");
        var trig = document.getElementById("leadPillTrigger");
        var picker = document.getElementById("leadPicker");
        if (picker) {
          picker.addEventListener("click", function (e) {
            var tgt = e.target && e.target.closest ? e.target.closest("[data-trend-min]") : null;
            if (!tgt) return;
            e.preventDefault();
            setTrendMin(tgt.getAttribute("data-trend-min"));
            collapseLeadPill();
          });
        }
        if (trig) {
          trig.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (pill && pill.getAttribute("data-state") === "expanded") collapseLeadPill();
            else expandLeadPill();
          });
        }
        document.addEventListener("click", function (e) {
          if (!pill || pill.getAttribute("data-state") !== "expanded") return;
          if (e.target.closest && e.target.closest("#leadPill")) return;
          collapseLeadPill();
        });
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && pill && pill.getAttribute("data-state") === "expanded") collapseLeadPill();
        });
        syncLeadPicker();
      }

      function renderAnomalyChips(p) {
        var chips = [];
        if (!p.onGround) {
          if (p.gsKt != null && p.gsKt > 700) chips.push({ text: "SUPERSONIC " + Math.round(p.gsKt) + " kt", cls: "warn" });
          if (p.altFt != null && p.altFt > 55000) chips.push({ text: "FL" + Math.round(p.altFt / 100), cls: "warn" });
          if (p.altFt != null && p.altFt < 3000 && p.gsKt != null && p.gsKt < 80 && p.gsKt > 5)
            chips.push({ text: "LOW-SLOW", cls: "warn" });
          if (p.vertRate != null && Math.abs(p.vertRate) > 4000)
            chips.push({ text: "VR " + (p.vertRate > 0 ? "+" : "") + Math.round(p.vertRate) + " FPM", cls: "warn" });
        }
        if (!chips.length) return "";
        var html = '<div class="sel-chips">';
        chips.forEach(function (c) {
          html += '<span class="sel-chip ' + c.cls + '">' + escapeHtml(c.text) + '</span>';
        });
        html += '</div>';
        return html;
      }

      function renderRouteBlock(callsign) {
        // Sad-state (no route, loading, not found) is already communicated by
        // the ROUTE chip in the loading-row strip — don't duplicate it as a
        // full-width block. Only render when we have a resolved origin+dest.
        var r = state.routes[callsign];
        if (!r || r.state !== "ok") return "";
        var oCode = escapeHtml(r.origin.iata || r.origin.icao || "");
        var dCode = escapeHtml(r.destination.iata || r.destination.icao || "");
        return '<div class="sel-route">' +
          '<span class="sel-airport">' + oCode + '</span>' +
          '<span class="sel-arrow">→</span>' +
          '<span class="sel-airport">' + dCode + '</span>' +
          '</div>';
      }

      function renderPhotoBlock(hex) {
        if (!hex) return "";
        var cached = photoCache[hex.toLowerCase()];
        if (!cached) return "";
        if (cached.state === "loading") {
          return '<div class="sel-photo sel-photo-empty">LOADING PHOTO…</div>';
        }
        if (cached.state === "ok") {
          var credit = cached.photographer
            ? 'Photo © ' + escapeHtml(cached.photographer) + ' via planespotters.net'
            : 'Photo via planespotters.net';
          var link = cached.link || "https://www.planespotters.net/";
          return '<a class="sel-photo sel-photo-link" href="' + escapeHtml(link) + '" target="_blank" rel="noopener">' +
            '<img src="' + escapeHtml(cached.src) + '" alt="Aircraft photo" loading="lazy">' +
            '<span class="sel-photo-credit">' + credit + '</span>' +
            '</a>';
        }
        return '<div class="sel-photo sel-photo-empty">NO PHOTO AVAILABLE</div>';
      }

      var photoCache = {};

      function fetchPlanePhoto(hex) {
        if (!hex) return;
        hex = hex.toLowerCase();
        if (photoCache[hex]) return;
        photoCache[hex] = { state: "loading" };
        var base = "https://api.planespotters.net/pub/photos/hex/" + hex;
        var urls = [base, viaCorsProxy(base), viaAllOrigins(base)];
        tryPhotoUrls(urls, 0).then(function (data) {
          var photo = data && data.photos && data.photos[0];
          if (photo && photo.thumbnail_large && photo.thumbnail_large.src) {
            photoCache[hex] = {
              state: "ok",
              src: photo.thumbnail_large.src,
              link: photo.link || "",
              photographer: (photo.photographer || "").toString()
            };
          } else {
            photoCache[hex] = { state: "none" };
          }
          if (state.selectedHex === hex) renderSelected();
        }).catch(function () {
          photoCache[hex] = { state: "error" };
          if (state.selectedHex === hex) renderSelected();
        });
      }

      function tryPhotoUrls(urls, idx) {
        if (idx >= urls.length) return Promise.reject(new Error("all failed"));
        return fetchTimeout(urls[idx], 8000).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        }).catch(function () { return tryPhotoUrls(urls, idx + 1); });
      }

      // ==================== SELECTION · POLLING · NOTABLE ====================

      function selectPlane(hex) {
        if (!hex) return;
        if (state.selectedHex === hex) { deselectAll(); return; }
        // Switching from another selection or fresh select.
        stopSelectedPoll();
        state.selectedHex = hex;
        state.selectedMmsi = null;
        state.lastSelectedPlane = null;
        state.lastSelectedAt = 0;
        // Snapshot the plane from the current bulk fetch (if present) so
        // trail/route/icon stay drawn even after the plane leaves the bbox.
        var sp = null;
        for (var i = 0; i < state.planes.length; i++) {
          if (state.planes[i].hex === state.selectedHex) { sp = state.planes[i]; break; }
        }
        state.selectedPlaneData = sp ? Object.assign({}, sp) : null;
        fetchPlanePhoto(state.selectedHex);
        if (sp && sp.callsign) fetchRoute(sp.callsign);
        fetchAircraftOwner(state.selectedHex);
        startSelectedPoll(state.selectedHex);
        renderRadar();
        renderList();
        renderSelected();
        renderOverlays();
      }

      // Unified deselect. Used by:
      //   (1) tap-same-plane-again (legacy toggle)
      //   (2) the ✕ close button on the selected card
      //   (3) tap on empty radar background (via maybeDeselectOnBackgroundTap)
      //
      // Deselection preserves the plane marker for up to 30 s (no trail/route/
      // vector) via the `lastSelectedPlane` grace buffer, then immediately
      // triggers a bulk fetch so the plane re-appears from `state.planes`
      // naturally as soon as possible.
      function deselectAll() {
        if (state.selectedHex && state.selectedPlaneData) {
          state.lastSelectedPlane = state.selectedPlaneData;
          state.lastSelectedAt = Date.now();
        }
        state.selectedHex = null;
        state.selectedMmsi = null;
        state.selectedPlaneData = null;
        stopSelectedPoll();
        fetchNow();
        renderRadar();
        renderShips();
        renderList();
        renderSelected();
        renderOverlays();
      }

      // Returns the currently-selected plane data. `selectedPlaneData` is the
      // authoritative source for rendering the selected plane's icon/overlays
      // (it's refreshed by every successful bulk fetch + every pollSelected
      // fast-poll). This prevents the "icon disappears for a few seconds"
      // flicker that happens when the selected plane is transiently absent
      // from state.planes between fetches.
      function getSelectedPlane() {
        if (!state.selectedHex) return null;
        if (state.selectedPlaneData) return state.selectedPlaneData;
        for (var i = 0; i < state.planes.length; i++) {
          if (state.planes[i].hex === state.selectedHex) return state.planes[i];
        }
        return null;
      }

      // Curated notable-callsign table. Instant match on every fetch so
      // famous mission callsigns are flagged with zero latency.
      var NOTABLE_CALLSIGNS = [
        // Head of state / US executive
        { pattern: "AF1",     kind: "exact",  label: "AIR FORCE ONE" },
        { pattern: "AF2",     kind: "exact",  label: "AIR FORCE TWO" },
        { pattern: "SAM",     kind: "prefix", label: "US SPECIAL AIR MISSION" },
        { pattern: "VENUS",   kind: "prefix", label: "US EXECUTIVE SUPPORT" },
        { pattern: "EXEC1F",  kind: "prefix", label: "US EXECUTIVE ONE FOXTROT" },
        // AWACS / AEW
        { pattern: "NATO",    kind: "prefix", label: "NATO AWACS" },
        { pattern: "MAGIC",   kind: "prefix", label: "NATO / FRENCH AWACS" },
        { pattern: "SENTRY",  kind: "prefix", label: "USAF AWACS (E-3)" },
        { pattern: "OKWTN",   kind: "prefix", label: "UK E-3 / AEW" },
        // USAF tankers / transport
        { pattern: "SNAKE",   kind: "prefix", label: "USAF TANKER" },
        { pattern: "REACH",   kind: "prefix", label: "USAF STRATEGIC AIRLIFT" },
        { pattern: "CONDOR",  kind: "prefix", label: "USAF TANKER / HAWAII ANG" },
        { pattern: "CINDY",   kind: "prefix", label: "USAF / ANG TANKER" },
        { pattern: "QID",     kind: "prefix", label: "USAF TANKER" },
        { pattern: "TEAL",    kind: "prefix", label: "USAF HURRICANE HUNTER" },
        { pattern: "NOAA",    kind: "prefix", label: "NOAA WEATHER RECON" },
        // Maritime patrol
        { pattern: "FORTE",   kind: "prefix", label: "USAF / USN ISR" },
        { pattern: "BATOV",   kind: "prefix", label: "NATO MARITIME PATROL" },
        { pattern: "PELICAN", kind: "prefix", label: "USCG FIXED-WING" },
        { pattern: "COAST",   kind: "prefix", label: "US COAST GUARD" },
        // Test / research
        { pattern: "NASA",    kind: "prefix", label: "NASA RESEARCH" },
        { pattern: "RSCH",    kind: "prefix", label: "RESEARCH / TEST FLIGHT" },
        { pattern: "TESTOP",  kind: "prefix", label: "USAF TEST SQUADRON" },
        { pattern: "BOE",     kind: "prefix", label: "BOEING TEST" },
        { pattern: "EDW",     kind: "prefix", label: "EDWARDS AFB TEST" },
        // Surveillance drones
        { pattern: "JAKE",    kind: "prefix", label: "USAF ISR DRONE" },
        { pattern: "RQ4",     kind: "prefix", label: "USAF GLOBAL HAWK" },
        { pattern: "TRITON",  kind: "prefix", label: "USN MQ-4C TRITON" },
        // UK / RAF
        { pattern: "RRR",     kind: "prefix", label: "RAF TRANSPORT" },
        { pattern: "KITTY",   kind: "prefix", label: "RAF VOYAGER TANKER" },
        { pattern: "VIKING",  kind: "prefix", label: "NATO / RAF" },
        { pattern: "ASCOT",   kind: "prefix", label: "RAF TRANSPORT" },
        // German Luftwaffe
        { pattern: "GAF",     kind: "prefix", label: "GERMAN AIR FORCE" },
        { pattern: "LUFTWAFFE", kind: "prefix", label: "GERMAN AIR FORCE" },
        // French AF
        { pattern: "FAF",     kind: "prefix", label: "FRENCH AIR FORCE" },
        { pattern: "CTM",     kind: "prefix", label: "FRENCH MILITARY TRANSPORT" },
        // Dutch / other NATO
        { pattern: "NAF",     kind: "prefix", label: "NETHERLANDS AF" },
        { pattern: "IAM",     kind: "prefix", label: "ITALIAN AIR FORCE" },
        { pattern: "CFC",     kind: "prefix", label: "CANADIAN FORCES" },
        { pattern: "CANFORCE", kind: "prefix", label: "CANADIAN FORCES" },
        // USAF training / other
        { pattern: "DUKE",    kind: "prefix", label: "USAF / US ARMY" },
        { pattern: "HAWK",    kind: "prefix", label: "USAF TRAINING" },
        // Medevac / state emergency
        { pattern: "MEDEVAC", kind: "prefix", label: "MEDICAL EVAC" },
        { pattern: "LIFEFLT", kind: "prefix", label: "MEDICAL TRANSPORT" },
        // Law enforcement
        { pattern: "FBI",     kind: "prefix", label: "FBI" },
        { pattern: "DHS",     kind: "prefix", label: "US DHS / CBP" },
        { pattern: "OMAHA",   kind: "prefix", label: "USAF E-6 DOOMSDAY" },
        { pattern: "LOOKING", kind: "prefix", label: "USAF E-6 MERCURY" }
      ];
      function matchNotableCallsign(callsign) {
        if (!callsign) return null;
        var q = callsign.toString().trim().toUpperCase();
        if (!q) return null;
        for (var i = 0; i < NOTABLE_CALLSIGNS.length; i++) {
          var n = NOTABLE_CALLSIGNS[i];
          if (n.kind === "exact" && q === n.pattern) return n;
          if (n.kind === "prefix" && q.indexOf(n.pattern) === 0) return n;
        }
        return null;
      }

      // Operator lookup via adsbdb.com. Called on plane selection. Caches
      // result in state.aircraftOwner[hex] so repeated selections don't refetch.
      var NOTABLE_OPERATOR_KEYWORDS = [
        { re: /\bAIR\s*FORCE\b/i,        label: "AIR FORCE" },
        { re: /\b(NAVY|NAVAL)\b/i,       label: "NAVY" },
        { re: /\bARMY\b/i,               label: "ARMY" },
        { re: /\bMARINE\s*CORPS\b/i,     label: "US MARINES" },
        { re: /\bCOAST\s*GUARD\b/i,      label: "COAST GUARD" },
        { re: /\bNATO\b/i,               label: "NATO" },
        { re: /\bNASA\b/i,               label: "NASA" },
        { re: /\bROYAL\s*AIR\s*FORCE\b/i, label: "ROYAL AIR FORCE" },
        { re: /\bLUFTWAFFE\b/i,          label: "LUFTWAFFE" },
        { re: /\bGOUVERNEMENT|GOVERNMENT\b/i, label: "GOVERNMENT" },
        { re: /\bFBI\b/i,                label: "FBI" },
        { re: /\bDHS\b|CUSTOMS|BORDER/i, label: "DHS / CBP" },
        { re: /\bSTATE\s*POLICE|SHERIFF\b/i, label: "LAW ENFORCEMENT" },
        { re: /\bHURRICANE\s*HUNTERS?\b/i, label: "HURRICANE HUNTERS" },
        { re: /\bBOEING\s+TEST|TEST\s+FLIGHT\b/i, label: "TEST FLIGHT" }
      ];
      function fetchAircraftOwner(hex) {
        if (!hex) return;
        var key = hex.toLowerCase();
        if (state.aircraftOwner[key]) return;
        state.aircraftOwner[key] = { state: "loading" };
        var base = "https://api.adsbdb.com/v0/aircraft/" + encodeURIComponent(key);
        var urls = [base, viaCorsProxy(base), viaAllOrigins(base)];
        tryPhotoUrls(urls, 0).then(function (data) {
          var a = data && data.response && (data.response.aircraft || data.response);
          var operator = (a && (a.registered_owner || a.owner || a.operator_flag_code || a.operator)) || "";
          var label = null;
          if (operator) {
            for (var i = 0; i < NOTABLE_OPERATOR_KEYWORDS.length; i++) {
              if (NOTABLE_OPERATOR_KEYWORDS[i].re.test(operator)) {
                label = NOTABLE_OPERATOR_KEYWORDS[i].label + " · " + operator.toUpperCase();
                break;
              }
            }
          }
          state.aircraftOwner[key] = { state: "ok", operator: operator, label: label };
          if (state.selectedHex === key) renderSelected();
        }).catch(function () {
          state.aircraftOwner[key] = { state: "error" };
        });
      }

      function startSelectedPoll(hex) {
        stopSelectedPoll();
        if (!hex) return;
        state.selectedPollTimer = setInterval(function () { pollSelected(hex); }, 5000);
        pollSelected(hex); // kick off immediately
        fetchHistoricalTrack(hex);
      }

      function fetchHistoricalTrack(hex) {
        if (!hex) return;
        var key = hex.toLowerCase();
        if (state.historicalFetched[key]) return;
        state.historicalFetched[key] = true;
        var base = "https://opensky-network.org/api/tracks/all?icao24=" + key + "&time=0";
        var urls = [base, viaCorsProxy(base), viaAllOrigins(base)];
        tryPhotoUrls(urls, 0).then(function (data) {
          if (!data || !data.path || !data.path.length) return;
          var existing = state.tracks[key] || [];
          var seen = {};
          for (var i = 0; i < existing.length; i++) seen[existing[i].t] = true;
          var merged = existing.slice();
          data.path.forEach(function (p) {
            // [time, lat, lon, baro_alt, track, onground]
            if (p[1] == null || p[2] == null) return;
            var tMs = (p[0] || 0) * 1000;
            if (seen[tMs]) return;
            merged.push({
              lat: p[1],
              lon: p[2],
              t: tMs,
              alt: p[3] != null ? Math.round(p[3] * 3.28084) : null,
              historical: true
            });
          });
          merged.sort(function (a, b) { return a.t - b.t; });
          if (merged.length > 500) merged = merged.slice(merged.length - 500);
          state.tracks[key] = merged;
          if (state.selectedHex === key) renderOverlays();
        }).catch(function () { /* ignore */ });
      }
      function stopSelectedPoll() {
        if (state.selectedPollTimer) {
          clearInterval(state.selectedPollTimer);
          state.selectedPollTimer = null;
        }
      }
      function pollSelected(hex) {
        if (state.selectedHex !== hex) { stopSelectedPoll(); return; }
        var base = "https://opendata.adsb.fi/api/v2/hex/" + hex;
        var alt = "https://api.adsb.lol/v2/hex/" + hex;
        var urls = [base, alt, viaCorsProxy(base), viaCorsProxy(alt)];
        tryPhotoUrls(urls, 0).then(function (data) {
          var arr = (data && (data.ac || data.aircraft)) || [];
          if (!arr.length) return;
          var a = arr[0];
          var lat = (typeof a.lat === "number") ? a.lat : null;
          var lon = (typeof a.lon === "number") ? a.lon : null;
          if (lat == null || lon == null) return;
          var altRaw = a.alt_baro != null ? a.alt_baro : a.alt_geom;
          var onGround = altRaw === "ground" || a.ground === true;
          var altFt = typeof altRaw === "number" ? altRaw : null;
          var vr = (typeof a.baro_rate === "number") ? a.baro_rate
                 : (typeof a.geom_rate === "number") ? a.geom_rate : null;
          // Update the in-bbox plane if present…
          var found = null;
          for (var i = 0; i < state.planes.length; i++) {
            if (state.planes[i].hex === hex.toLowerCase()) { found = state.planes[i]; break; }
          }
          if (found) {
            found.lat = lat;
            found.lon = lon;
            if (altFt != null) found.altFt = altFt;
            if (typeof a.gs === "number") found.gsKt = a.gs;
            if (typeof a.track === "number") found.trackDeg = a.track;
            if (vr != null) found.vertRate = vr;
            found.onGround = onGround;
            found.distNm = haversineNm(state.center.lat, state.center.lon, lat, lon);
            // Reset dead-reckoning base to the just-fetched ground truth.
            found.baseLat = lat;
            found.baseLon = lon;
            found.baseAt = Date.now();
          }
          // …and always refresh the sticky selected-plane snapshot so the
          // trail/icon/route stay correct when the plane is outside the bbox.
          var base2 = (found ? Object.assign({}, found) : (state.selectedPlaneData || {}));
          base2.hex = hex.toLowerCase();
          base2.lat = lat;
          base2.lon = lon;
          if (altFt != null) base2.altFt = altFt;
          if (typeof a.gs === "number") base2.gsKt = a.gs;
          if (typeof a.track === "number") base2.trackDeg = a.track;
          if (vr != null) base2.vertRate = vr;
          base2.onGround = onGround;
          var callsign = (a.flight || "").toString().trim();
          if (callsign) base2.callsign = callsign;
          if (a.r) base2.registration = a.r;
          if (a.t) base2.type = a.t;
          if (a.squawk) base2.squawk = a.squawk;
          base2.distNm = haversineNm(state.center.lat, state.center.lon, lat, lon);
          // Reset dead-reckoning base to the just-fetched ground truth.
          base2.baseLat = lat;
          base2.baseLon = lon;
          base2.baseAt = Date.now();
          state.selectedPlaneData = base2;
          // Mark pollSelected as authoritative for the next 6 s so bulk-fetch
          // and accumulateTracks don't write a competing position.
          state.lastPollSelectedAt = Date.now();
          if (base2.callsign && !state.routes[base2.callsign.toUpperCase()]) fetchRoute(base2.callsign);
          // Append to track history keyed by hex (works regardless of bbox).
          var tkey = hex.toLowerCase();
          var t = state.tracks[tkey] || (state.tracks[tkey] = []);
          var prev = t.length ? t[t.length - 1] : null;
          if (!prev || Math.abs(prev.lat - lat) > 0.0001 || Math.abs(prev.lon - lon) > 0.0001) {
            t.push({ lat: lat, lon: lon, t: Date.now(), alt: altFt });
            if (t.length > 500) t.shift();
          }
          renderRadar();
          renderOverlays();
          renderSelected();
        }).catch(function () { /* ignore — retry on next tick */ });
      }

      // ==================== APP LIFECYCLE · RANGE · AIRPORT SEARCH ====================

      function renderAll() {
        renderRadar();
        renderShips();
        renderList();
        renderSelected();
      }

      // Event wiring
      refreshBtn.addEventListener("click", fetchNow);

      latInput.addEventListener("change", function () {
        if (readCoordInputs()) onCenterChanged();
      });
      lonInput.addEventListener("change", function () {
        if (readCoordInputs()) onCenterChanged();
      });

      var rangeSlider = document.getElementById("rangeSlider");
      var rangeValEl = document.getElementById("rangeVal");
      function applyRange(nm, options) {
        options = options || {};
        nm = Math.max(RANGE_MIN, Math.min(RANGE_MAX, Math.round(nm)));
        if (nm === state.rangeNm && !options.force) return;
        state.rangeNm = nm;
        if (rangeValEl) rangeValEl.textContent = nm + " NM";
        if (rangeSlider) rangeSlider.value = nmToSlider(nm).toFixed(1);
        updateRangeLabels();
        if (!options.skipRender) renderTiles();
        if (!options.skipFetch) { fetchNow(); resubscribeAis(); renderShips(); }
      }
      if (rangeSlider) {
        if (rangeValEl) rangeValEl.textContent = state.rangeNm + " NM";
        rangeSlider.value = nmToSlider(state.rangeNm).toFixed(1);
        var rangeChangeTimer = null;
        rangeSlider.addEventListener("input", function () {
          var nm = sliderToNm(parseFloat(rangeSlider.value));
          state.rangeNm = nm;
          if (rangeValEl) rangeValEl.textContent = nm + " NM";
          updateRangeLabels();
          if (rangeChangeTimer) clearTimeout(rangeChangeTimer);
          rangeChangeTimer = setTimeout(function () {
            renderTiles(); fetchNow(); resubscribeAis(); renderShips();
          }, 180);
        });
      }

      // Pause every poll-cadence timer when the tab is backgrounded, so we
      // don't burn API credits on a view the user isn't watching. Streaming
      // (AIS WebSocket) and local compute (dead-reckoning, render loop)
      // intentionally stay alive — they're either cheap or self-recovering.
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          if (state.refreshTimer) { clearTimeout(state.refreshTimer); state.refreshTimer = null; }
          if (state.countdownTimer) { clearInterval(state.countdownTimer); state.countdownTimer = null; }
          if (state.selectedPollTimer) { clearInterval(state.selectedPollTimer); state.selectedPollTimer = null; }
          if (state.militaryRefreshTimer) { clearInterval(state.militaryRefreshTimer); state.militaryRefreshTimer = null; }
        } else {
          fetchNow();
          if (state.selectedHex) startSelectedPoll(state.selectedHex);
          refreshMilitary();
          state.militaryRefreshTimer = setInterval(refreshMilitary, 2 * 60 * 1000);
        }
      });

      // Parses FAA NASR-style DMS coords like "34-20-51.1000N" / "119-03-36.0000W"
      // into signed decimal degrees. Returns NaN on any parse failure.
      function parseDMS(s) {
        if (typeof s !== "string") return NaN;
        var m = s.match(/^\s*(\d+)[-\s](\d+)[-\s]([\d.]+)\s*([NSEW])\s*$/i);
        if (!m) return NaN;
        var deg = parseFloat(m[1]), min = parseFloat(m[2]), sec = parseFloat(m[3]);
        var val = deg + min / 60 + sec / 3600;
        var dir = m[4].toUpperCase();
        if (dir === "S" || dir === "W") val = -val;
        return val;
      }

      // Live airport lookup fallback for ICAO codes missing from the bundled
      // OpenFlights dataset (which omits most small US GA fields). Hits the
      // free FAA NASR mirror at aviationapi.com, then CORS proxies on failure.
      // Result cached on state.airportLive keyed by uppercased ICAO.
      // onResolve fires with the apt object (or null) so the caller can re-render.
      // Strict numeric parser. Unlike parseFloat, rejects strings that
      // start with digits but contain DMS punctuation (e.g.
      // "34-20-51.1000N" → NaN, not 34). Used in fetchAirportLive so
      // the parseDMS fallback actually runs when aviationapi returns a
      // DMS string under a *_deg field — without this, the W hemisphere
      // sign would be silently dropped (cf. KSZP at "34, 119" instead
      // of (34.34, -119.06)).
      function strictNum(v) {
        if (typeof v === "number") return isFinite(v) ? v : NaN;
        if (typeof v !== "string") return NaN;
        var s = v.trim();
        if (!s) return NaN;
        var n = Number(s);
        return isFinite(n) ? n : NaN;
      }

      function fetchAirportLive(icao, onResolve) {
        icao = (icao || "").trim().toUpperCase();
        if (!icao) return;
        var cached = state.airportLive[icao];
        if (cached === "pending") return;
        if (cached !== undefined) { onResolve(cached); return; }
        state.airportLive[icao] = "pending";
        var base = "https://api.aviationapi.com/v1/airports?apt=" + encodeURIComponent(icao);
        var urls = [base, viaCorsProxy(base), viaAllOrigins(base)];
        tryPhotoUrls(urls, 0).then(function (j) {
          var arr = j && j[icao];
          var row = arr && arr.length ? arr[0] : null;
          if (!row) { state.airportLive[icao] = null; onResolve(null); return; }
          var lat = strictNum(row.latitude_deg != null ? row.latitude_deg : row.latitude);
          var lon = strictNum(row.longitude_deg != null ? row.longitude_deg : row.longitude);
          if (!isFinite(lat)) lat = parseDMS(row.latitude);
          if (!isFinite(lon)) lon = parseDMS(row.longitude);
          // Range + null-island guard catches malformed responses,
          // accidental hemisphere drops, and the "0,0" sentinel.
          if (!isFinite(lat) || !isFinite(lon)
              || Math.abs(lat) > 90 || Math.abs(lon) > 180
              || (lat === 0 && lon === 0)) {
            state.airportLive[icao] = null;
            onResolve(null);
            return;
          }
          var apt = {
            iata: row.faa_ident && row.faa_ident !== row.icao_id ? row.faa_ident : "",
            icao: row.icao_id || icao,
            name: row.facility_name || icao,
            city: row.city || "",
            country: row.state_full || "United States",
            lat: lat,
            lon: lon
          };
          state.airportLive[icao] = apt;
          onResolve(apt);
        }).catch(function () {
          state.airportLive[icao] = null;
          onResolve(null);
        });
      }

      function setupAirportSearch() {
        var input = document.getElementById("airportInput");
        var dropdown = document.getElementById("airportDropdown");
        var clearBtn = document.getElementById("airportClear");
        if (!input || !dropdown) return;
        var highlighted = -1;

        function toggleClear() { if (clearBtn) clearBtn.hidden = !input.value; }
        if (clearBtn) {
          clearBtn.addEventListener("click", function () {
            input.value = "";
            dropdown.hidden = true;
            toggleClear();
            input.focus();
          });
        }

        function match(q) {
          q = q.trim().toUpperCase();
          if (!q) return [];
          // Handle text that starts with an already-formatted selection like
          // "SFO · San Francisco Intl" — extract the leading code token.
          var sepIdx = q.indexOf(" · ");
          if (sepIdx > 0) q = q.substring(0, sepIdx);
          var list = getAirports();
          var exactIata = [], exactIcao = [], prefixIata = [], prefixIcao = [], prefixCity = [], substr = [];
          for (var i = 0; i < list.length; i++) {
            var a = list[i];
            if (a.iata && a.iata === q) exactIata.push(a);
            else if (a.icao && a.icao === q) exactIcao.push(a);
            else if (a.iata && a.iata.indexOf(q) === 0) prefixIata.push(a);
            else if (a.icao && a.icao.indexOf(q) === 0) prefixIcao.push(a);
            else if (a.city && a.city.toUpperCase().indexOf(q) === 0) prefixCity.push(a);
            else if ((a.city && a.city.toUpperCase().indexOf(q) !== -1) || (a.name && a.name.toUpperCase().indexOf(q) !== -1)) substr.push(a);
            var tot = exactIata.length + exactIcao.length + prefixIata.length + prefixIcao.length + prefixCity.length + substr.length;
            if (tot > 40) break;
          }
          var out = exactIata.concat(exactIcao, prefixIata, prefixIcao, prefixCity, substr).slice(0, 8);
          // Merge in live-fetched airport (e.g. KSZP from aviationapi.com
          // for small US GA fields absent from bundled OpenFlights).
          if (!out.length) {
            var live = state.airportLive[q];
            if (live && typeof live === "object") out = [live];
          }
          return out;
        }

        // Query looks like a full 4-letter ICAO — the aviationapi.com fallback
        // is FAA-only so IATA prefixes won't hit. Restricting to 4 letters
        // also naturally dedupes requests as the user types.
        function isCodeShaped(q) {
          q = q.trim().toUpperCase();
          if (q.indexOf(" · ") > 0) q = q.substring(0, q.indexOf(" · "));
          return /^[A-Z]{4}$/.test(q);
        }
        function canonQuery(q) {
          q = q.trim().toUpperCase();
          var sep = q.indexOf(" · ");
          return sep > 0 ? q.substring(0, sep) : q;
        }
        function maybeLiveLookup(q) {
          if (!isCodeShaped(q)) return;
          var code = canonQuery(q);
          fetchAirportLive(code, function () {
            // Re-render only if user hasn't moved on to a different query.
            if (canonQuery(input.value) !== code) return;
            render(match(input.value));
          });
        }

        function render(matches) {
          highlighted = matches.length ? 0 : -1;
          if (!matches.length) {
            var q = input.value.trim();
            if (!q) { dropdown.hidden = true; dropdown.innerHTML = ""; return; }
            dropdown.hidden = false;
            var code = canonQuery(q);
            var live = isCodeShaped(q) ? state.airportLive[code] : undefined;
            var msg;
            if (live === "pending") msg = "Searching FAA registry…";
            else if (live === null) msg = "No match · try lat/lon below";
            else msg = "No match in built-in list · try lat/lon below";
            dropdown.innerHTML = '<div class="apt-item" style="cursor:default"><span class="apt-code" style="color:var(--muted)">—</span><span class="apt-name" style="color:var(--muted)">' + escapeHtml(msg) + '</span></div>';
            return;
          }
          dropdown.hidden = false;
          var html = "";
          for (var i = 0; i < matches.length; i++) {
            var a = matches[i];
            var code = a.iata || a.icao || "—";
            var rest = (a.city || "") + (a.city && a.name ? " · " : "") + (a.name || "");
            html += '<div class="apt-item" data-iata="' + escapeHtml(a.iata || "") + '" data-icao="' + escapeHtml(a.icao || "") + '">' +
              '<span class="apt-code">' + escapeHtml(code) + '</span>' +
              '<span class="apt-name">' + escapeHtml(rest) + '</span>' +
              '</div>';
          }
          dropdown.innerHTML = html;
          var items = dropdown.querySelectorAll(".apt-item");
          updateHighlight(items);
          for (var j = 0; j < items.length; j++) {
            (function (el) {
              el.addEventListener("click", function () {
                var iata = el.dataset.iata || "";
                var icao = el.dataset.icao || "";
                var list = getAirports();
                var apt = null;
                for (var k = 0; k < list.length; k++) {
                  var cand = list[k];
                  if ((iata && cand.iata === iata) || (icao && cand.icao === icao)) { apt = cand; break; }
                }
                if (!apt && icao && state.airportLive[icao] && typeof state.airportLive[icao] === "object") {
                  apt = state.airportLive[icao];
                }
                if (!apt) return;
                var label = apt.iata || apt.icao;
                state.center = { lat: apt.lat, lon: apt.lon, label: label, id: apt.icao || apt.iata };
                syncCoordInputs();
                markActivePreset();
                input.value = label + (apt.city ? " · " + apt.city : "");
                dropdown.hidden = true;
                onCenterChanged();
              });
            })(items[j]);
          }
        }

        function updateHighlight(items) {
          if (!items) items = dropdown.querySelectorAll(".apt-item");
          for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle("highlighted", i === highlighted);
          }
        }

        function applyIndex(idx) {
          var m = match(input.value);
          if (!m.length) return false;
          var apt = m[Math.max(0, Math.min(idx, m.length - 1))];
          var label = apt.iata || apt.icao || "";
          state.center = { lat: apt.lat, lon: apt.lon, label: label, id: apt.icao || apt.iata };
          syncCoordInputs();
          markActivePreset();
          input.value = label + (apt.city ? " · " + apt.city : "");
          dropdown.hidden = true;
          input.blur();
          toggleClear();
          onCenterChanged();
          return true;
        }
        function applyFirstMatch() {
          if (applyIndex(highlighted < 0 ? 0 : highlighted)) return true;
          // Nothing bundled matched — if query looks like a code, try
          // live lookup then apply when it returns.
          if (isCodeShaped(input.value)) {
            maybeLiveLookup(input.value);
          }
          return false;
        }

        input.addEventListener("input", function () {
          toggleClear();
          var m = match(input.value);
          if (!m.length) maybeLiveLookup(input.value);
          render(match(input.value));
        });
        input.addEventListener("focus", function () {
          toggleClear();
          if (input.value) {
            var m = match(input.value);
            if (!m.length) maybeLiveLookup(input.value);
            render(match(input.value));
          }
        });
        var goBtn = document.getElementById("airportGo");
        if (goBtn) goBtn.addEventListener("click", applyFirstMatch);
        input.addEventListener("keydown", function (e) {
          var m = match(input.value);
          if (e.key === "Enter") {
            e.preventDefault();
            applyFirstMatch();
          } else if (e.key === "Escape") {
            dropdown.hidden = true;
            input.blur();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (m.length) { highlighted = (highlighted + 1) % m.length; updateHighlight(); }
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (m.length) { highlighted = (highlighted - 1 + m.length) % m.length; updateHighlight(); }
          }
        });
        document.addEventListener("click", function (e) {
          if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.hidden = true;
        });
      }

      // ==================== GESTURE · RADAR DRAG · PINCH ====================

      function setupRadarDrag() {
        var svg = document.getElementById("radar");
        if (!svg) return;

        // Gesture invariants (see CLAUDE.md → Gesture invariants):
        // - `mode` is the single source of truth for what gesture is active.
        // - Transition functions below are the only legal mutators.
        // - Always snapshot a pointer's position BEFORE deleting from `pointers`,
        //   because commitPan/commitPinch need that last position for math.
        // - Every exit path from pan or pinch releases pointer captures.
        // - `pointercancel` always resets to a clean idle state.
        var mode = "idle";       // "idle" | "pan" | "pinch"
        var pointers = {};       // pointerId -> { x, y }
        var panStart = null;     // snapshot when entering pan
        var pinchStart = null;   // snapshot when entering pinch

        var LAYER_IDS = ["tileLayer", "labelLayer", "planeLayer", "shipLayer",
                         "trackLayer", "routeLayer", "vectorLayer"];
        function layers() {
          return LAYER_IDS.map(function (id) { return document.getElementById(id); })
                          .filter(function (x) { return x; });
        }
        function applyTransform(dxVB, dyVB) {
          var t = "translate(" + dxVB.toFixed(2) + " " + dyVB.toFixed(2) + ")";
          layers().forEach(function (l) { l.setAttribute("transform", t); });
        }
        function clearTransform() {
          layers().forEach(function (l) { l.removeAttribute("transform"); });
        }
        function pointerCount() { return Object.keys(pointers).length; }
        function twoPointers() {
          var ids = Object.keys(pointers);
          if (ids.length < 2) return null;
          return [pointers[ids[0]], pointers[ids[1]]];
        }
        function suspendAutoRefresh() {
          if (state.refreshTimer) { clearTimeout(state.refreshTimer); state.refreshTimer = null; }
          if (state.countdownTimer) { clearInterval(state.countdownTimer); state.countdownTimer = null; }
        }
        function releaseAllCaptures() {
          Object.keys(pointers).forEach(function (id) {
            try { svg.releasePointerCapture(parseInt(id, 10)); } catch (e) {}
          });
          if (panStart && panStart.pointerId != null) {
            try { svg.releasePointerCapture(panStart.pointerId); } catch (e) {}
          }
        }
        function resetAll() {
          releaseAllCaptures();
          mode = "idle";
          panStart = null;
          pinchStart = null;
          clearTransform();
        }

        // --- transitions ---

        function enterPan(pointerId, x, y, downTarget) {
          var rect = svg.getBoundingClientRect();
          mode = "pan";
          pinchStart = null;
          panStart = {
            pointerId: pointerId,
            startX: x,
            startY: y,
            startLat: state.center.lat,
            startLon: state.center.lon,
            vbPerPx: 220 / rect.width,
            captured: false,
            // True if pointerdown landed on a plane/ship marker — means we
            // should NOT treat a no-drag release as a background deselect.
            // The plane/ship's own click handler runs after the pointer sequence.
            downTargetInteractive: !!(downTarget &&
              (downTarget.closest ? downTarget.closest("[data-hex], [data-mmsi]") : null))
          };
        }

        function enterPinch() {
          var two = twoPointers();
          if (!two) return;
          var d = Math.hypot(two[0].x - two[1].x, two[0].y - two[1].y);
          mode = "pinch";
          pinchStart = { initialDist: Math.max(10, d), initialRangeNm: state.rangeNm };
          // Abandon any in-progress pan cleanly, including its capture.
          if (panStart && panStart.pointerId != null) {
            try { svg.releasePointerCapture(panStart.pointerId); } catch (e) {}
          }
          panStart = null;
          clearTransform();
          suspendAutoRefresh();
        }

        function commitPinch() {
          pinchStart = null;
          mode = "idle";
          renderTiles();
          renderRadar();
          renderShips();
          renderOverlays();
          fetchNow();
          resubscribeAis();
        }

        // `lastPt` = the last known {x, y} of the pan-owning pointer, captured
        // BEFORE it was deleted from `pointers` in onPointerEnd. Without this,
        // `pointers[panStart.pointerId]` reads undefined and dx/dy collapse to 0,
        // which manifests as a "pan snaps back to origin on release" bug.
        function commitPan(lastPt) {
          if (!panStart) { mode = "idle"; return; }
          var ps = panStart;
          try { svg.releasePointerCapture(ps.pointerId); } catch (e) {}
          panStart = null;
          mode = "idle";
          if (!ps.captured) {
            // Genuine tap, not a drag. Treat as a potential background-tap
            // deselect if the tap wasn't on an interactive marker.
            maybeDeselectOnBackgroundTap(ps);
            return;
          }
          var dx = (lastPt ? lastPt.x : ps.startX) - ps.startX;
          var dy = (lastPt ? lastPt.y : ps.startY) - ps.startY;
          var dxVB = dx * ps.vbPerPx;
          var dyVB = dy * ps.vbPerPx;
          var mPerVB = state.rangeNm * 1852 / 100;
          var dLat = (dyVB * mPerVB) / 111320;
          var dLon = -(dxVB * mPerVB) / (111320 * Math.max(0.01, Math.cos(ps.startLat * Math.PI / 180)));
          var newLat = Math.max(-85, Math.min(85, ps.startLat + dLat));
          var newLon = ((ps.startLon + dLon + 540) % 360) - 180;
          state.center = { lat: newLat, lon: newLon, label: "Custom", id: "custom" };
          syncCoordInputs();
          markActivePreset();
          clearTransform();
          renderTiles();
          renderRadar();
          renderShips();
          renderOverlays();
          updateTacReadout();
          fetchNow();
          resubscribeAis();
        }

        function maybeDeselectOnBackgroundTap(ps) {
          if (ps.downTargetInteractive) return; // plane/ship tap — let click handler fire
          if (!state.selectedHex && !state.selectedMmsi) return;
          deselectAll();
        }

        // --- event handlers ---

        // Prune any stored pointer whose timestamp is older than `maxAgeMs`.
        // Defends against lost pointerup/pointercancel events, which iOS
        // Safari occasionally drops during fast multi-touch. The invariant:
        // a real finger on screen emits pointermoves (even tiny ones); if
        // `pointers[id]` hasn't been touched in maxAgeMs, treat it as lifted.
        function sweepStalePointers(maxAgeMs) {
          var now = Date.now();
          var removed = [];
          Object.keys(pointers).forEach(function (id) {
            var p = pointers[id];
            if ((now - (p.t || 0)) > maxAgeMs) {
              delete pointers[id];
              try { svg.releasePointerCapture(parseInt(id, 10)); } catch (e) {}
              removed.push(id);
            }
          });
          return removed;
        }

        svg.addEventListener("pointerdown", function (e) {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          // Before any mode transition, sweep any stuck pointers whose last
          // move is > 1 s old. Backstop for dropped pointerup/pointercancel.
          sweepStalePointers(1000);
          // If the sweep emptied the pointer set but mode is still non-idle,
          // reset the state machine so we start the new gesture from "idle".
          if (pointerCount() === 0 && mode !== "idle") resetAll();
          // Defensive: if the same pointerId arrives again without cleanup
          // (rare iOS duplicate), drop the old entry first.
          if (e.pointerId in pointers) delete pointers[e.pointerId];
          pointers[e.pointerId] = { x: e.clientX, y: e.clientY, t: Date.now() };
          var n = pointerCount();
          if (n === 1 && mode === "idle") {
            enterPan(e.pointerId, e.clientX, e.clientY, e.target);
          } else if (n >= 2 && mode !== "pinch") {
            enterPinch();
          }
        });

        svg.addEventListener("pointermove", function (e) {
          if (!(e.pointerId in pointers)) return;
          pointers[e.pointerId].x = e.clientX;
          pointers[e.pointerId].y = e.clientY;
          pointers[e.pointerId].t = Date.now();

          if (mode === "pinch" && pinchStart) {
            // Stale-pointer guard: if the OTHER stored pointer hasn't moved
            // in 400 ms, iOS almost certainly ate its pointerup. Synthesize
            // the lift, finish the pinch, and hand off to pan so the single
            // remaining finger can actually pan instead of "continuing to zoom".
            var now = Date.now();
            var ids = Object.keys(pointers);
            if (ids.length === 2) {
              var staleId = null;
              for (var k = 0; k < 2; k++) {
                if (ids[k] !== String(e.pointerId) &&
                    (now - (pointers[ids[k]].t || 0)) > 400) {
                  staleId = ids[k];
                  break;
                }
              }
              if (staleId) {
                delete pointers[staleId];
                try { svg.releasePointerCapture(parseInt(staleId, 10)); } catch (err) {}
                commitPinch();
                enterPan(e.pointerId, e.clientX, e.clientY, null);
                e.preventDefault();
                return;
              }
            }
            var two = twoPointers();
            if (!two) return;
            var d = Math.hypot(two[0].x - two[1].x, two[0].y - two[1].y);
            if (d < 10) return;
            var ratio = pinchStart.initialDist / d;
            var newNm = pinchStart.initialRangeNm * ratio;
            // skipRender avoids churning the tile grid on every move frame;
            // tiles redraw once on commitPinch.
            applyRange(newNm, { skipFetch: true, skipRender: true });
            e.preventDefault();
            return;
          }

          if (mode === "pan" && panStart && e.pointerId === panStart.pointerId) {
            var dx = e.clientX - panStart.startX;
            var dy = e.clientY - panStart.startY;
            if (!panStart.captured) {
              if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
              panStart.captured = true;
              try { svg.setPointerCapture(e.pointerId); } catch (err) {}
              suspendAutoRefresh();
            }
            applyTransform(dx * panStart.vbPerPx, dy * panStart.vbPerPx);
            e.preventDefault();
          }
        });

        function onPointerEnd(e) {
          if (!(e.pointerId in pointers)) return;
          // Snapshot last position BEFORE deleting — commitPan needs it.
          var lastPt = { x: pointers[e.pointerId].x, y: pointers[e.pointerId].y };
          delete pointers[e.pointerId];
          var remaining = pointerCount();

          if (mode === "pinch") {
            if (remaining === 0) {
              commitPinch();
            } else if (remaining === 1) {
              // Commit the pinch's range change, then hand off to pan for
              // the remaining finger starting at its CURRENT position (so
              // the next pointermove has dx=0 instead of an accumulated
              // delta from before the pinch).
              commitPinch();
              var id = Object.keys(pointers)[0];
              var pt = pointers[id];
              enterPan(parseInt(id, 10), pt.x, pt.y, null);
            }
            // If remaining >= 2, a third finger lifted — stay in pinch.
            return;
          }

          if (mode === "pan" && panStart && e.pointerId === panStart.pointerId) {
            if (remaining === 0) {
              commitPan(lastPt);
            } else {
              // The pan-owning pointer lifted but others remain. Release
              // capture, cancel the pan; next pointerdown/up decides the mode.
              try { svg.releasePointerCapture(panStart.pointerId); } catch (err) {}
              panStart = null;
              mode = "idle";
              clearTransform();
            }
          }
        }

        svg.addEventListener("pointerup", onPointerEnd);
        svg.addEventListener("pointercancel", function (e) {
          // iOS occasionally delivers pointercancel instead of pointerup
          // when the system takes over the gesture (e.g. multi-app
          // switcher, safari gestures). preventDefault so Safari doesn't
          // keep the gesture; resetAll to land in a clean idle state.
          e.preventDefault();
          delete pointers[e.pointerId];
          resetAll();
        });
      }

      // ==================== SETTINGS · AIS · SHIPS · BOOT ====================

      function setupSettings() {
        var btn = document.getElementById("settingsBtn");
        var panel = document.getElementById("settingsPanel");
        var input = document.getElementById("aisKeyInput");
        var save = document.getElementById("aisKeySave");
        var clearBtn = document.getElementById("aisKeyClear");
        var statusEl = document.getElementById("aisStatus");
        if (!btn || !panel || !input) return;
        function refreshUi() {
          if (state.aisKey) {
            input.value = state.aisKey;
            clearBtn.hidden = false;
            statusEl.textContent = "KEY SAVED · SHIP TRACKING ENABLED";
            statusEl.className = "ais-status ok";
          } else {
            input.value = "";
            clearBtn.hidden = true;
            statusEl.textContent = "NO KEY · SHIP TRACKING DISABLED";
            statusEl.className = "ais-status";
          }
          updateShipsHint();
        }
        btn.addEventListener("click", function () {
          panel.hidden = !panel.hidden;
          if (!panel.hidden) renderAisDiag();
        });
        save.addEventListener("click", function () {
          var v = (input.value || "").trim();
          if (!v) return;
          state.aisKey = v;
          try { localStorage.setItem("aisstream.key", v); } catch (e) {}
          refreshUi();
          connectAisStream();
        });
        clearBtn.addEventListener("click", function () {
          state.aisKey = null;
          try { localStorage.removeItem("aisstream.key"); } catch (e) {}
          disconnectAisStream();
          state.ships = {};
          refreshUi();
          renderRadar(); renderList();
        });
        refreshUi();
      }

      function updateShipsHint() {
        // rendered inline in renderList
      }

      // AIS (aisstream.io) WebSocket
      function bboxForCenter() {
        var dLat = state.rangeNm / 60;
        var dLon = state.rangeNm / (60 * Math.max(0.01, Math.cos(state.center.lat * Math.PI / 180)));
        return [
          [state.center.lat - dLat, state.center.lon - dLon],
          [state.center.lat + dLat, state.center.lon + dLon]
        ];
      }

      // Bbox used specifically for AIS subscriptions. Decoupled from the
      // radar range via a 30 NM floor — if the user zooms the radar to
      // 5 NM, the ship subscription should still cover any adjacent port
      // or shipping lane. The radar still renders only ships visible in
      // its frustum; this just ensures we're subscribed to enough water.
      function aisBboxForCenter() {
        var rangeNm = Math.max(30, state.rangeNm);
        var dLat = rangeNm / 60;
        var dLon = rangeNm / (60 * Math.max(0.01, Math.cos(state.center.lat * Math.PI / 180)));
        return [
          [state.center.lat - dLat, state.center.lon - dLon],
          [state.center.lat + dLat, state.center.lon + dLon]
        ];
      }

      function aisStatus(text, cls) {
        var el = document.getElementById("aisStatus");
        if (!el) return;
        el.textContent = text;
        el.className = "ais-status" + (cls ? " " + cls : "");
      }

      // Called on initial connect and on every resubscribe. If 30 s elapse
      // with zero message frames, show an actionable message that
      // distinguishes cause: a key that never produces frames (account
      // verification / tier throttle) reads differently than "real" silence.
      // If error frames did arrive, that was already surfaced by the error
      // branch in the message handler — don't double-announce.
      function scheduleNoTrafficWarning() {
        if (state.aisNoTrafficTimer) clearTimeout(state.aisNoTrafficTimer);
        state.aisNoTrafficTimer = setTimeout(function () {
          if (state.aisMessageCount > 0) return;
          // Any error frame already updated the status to "AIS: <ERROR>".
          if (state.aisMsgTypes && state.aisMsgTypes.error) return;
          // Distinguish "nothing at all" from "non-positional frames only."
          var totalFrames = 0;
          var hasNonError = false;
          if (state.aisMsgTypes) {
            for (var k in state.aisMsgTypes) {
              if (!Object.prototype.hasOwnProperty.call(state.aisMsgTypes, k)) continue;
              totalFrames += state.aisMsgTypes[k];
              if (k && k.toLowerCase() !== "error") hasNonError = true;
            }
          }
          if (totalFrames === 0) {
            aisStatus("AIS CONNECTED · NO SHIP DATA · verify aisstream key or try a busy port", "warn");
          } else if (!hasNonError) {
            aisStatus("AIS CONNECTED · RECEIVING ERRORS · verify aisstream key", "warn");
          } else {
            aisStatus("AIS CONNECTED · QUIET AREA · try a busy port", "ok");
          }
          renderAisDiag();
        }, 30000);
      }

      // Populates the diagnostic block under the ais status line. Surfaces
      // every scrap of evidence we have about the subscription so the user
      // can tell a quiet bbox from a broken subscription from a parse bug.
      function renderAisDiag() {
        var el = document.getElementById("aisDiag");
        if (!el) return;
        if (!state.aisKey) { el.hidden = true; el.textContent = ""; return; }
        var lines = [];
        if (state.aisBbox) {
          var sw = state.aisBbox[0], ne = state.aisBbox[1];
          lines.push("bbox  SW " + sw[0].toFixed(2) + "," + sw[1].toFixed(2) +
                     "  NE " + ne[0].toFixed(2) + "," + ne[1].toFixed(2));
        }
        lines.push("msgs  " + state.aisMessageCount +
                   (state.aisFirstMsgAt
                     ? " (first " + Math.round((Date.now() - state.aisFirstMsgAt) / 1000) + "s ago)"
                     : ""));
        var typeKeys = Object.keys(state.aisMsgTypes || {});
        if (typeKeys.length) {
          var parts = typeKeys.map(function (k) { return k + ":" + state.aisMsgTypes[k]; });
          lines.push("types " + parts.join("  "));
        }
        if (state.aisLastMsgType) lines.push("last  " + state.aisLastMsgType);
        var shipCount = Object.keys(state.ships || {}).length;
        lines.push("ships " + shipCount + " known");
        el.textContent = lines.join("\n");
        el.hidden = false;
      }

      function disconnectAisStream() {
        if (state.aisReconnectTimer) { clearTimeout(state.aisReconnectTimer); state.aisReconnectTimer = null; }
        if (state.aisNoTrafficTimer) { clearTimeout(state.aisNoTrafficTimer); state.aisNoTrafficTimer = null; }
        if (state.aisSocket) {
          try { state.aisSocket.close(); } catch (e) {}
          state.aisSocket = null;
        }
        renderAisDiag();
      }

      function connectAisStream() {
        disconnectAisStream();
        if (!state.aisKey) return;
        try {
          var ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
          state.aisSocket = ws;
          ws.addEventListener("open", function () {
            state.aisReconnectAttempts = 0;
            state.aisMessageCount = 0;
            state.aisFirstMsgAt = 0;
            state.aisMsgTypes = {};
            state.aisLastMsgType = "";
            state.aisLoggedSamples = 0;
            var bb = aisBboxForCenter();
            state.aisBbox = bb;
            // Subscribe to all message types — filtering to just Class A
            // PositionReport + ShipStaticData was dropping Class B traffic
            // (tugs, pilot boats, yachts, fishing craft), which is a big
            // chunk of what moves around a busy port. aisstream's default
            // with no FilterMessageTypes is "all types."
            ws.send(JSON.stringify({
              APIKey: state.aisKey,
              BoundingBoxes: [[bb[0], bb[1]]]
            }));
            aisStatus("AIS CONNECTED · WAITING FOR TRAFFIC", "ok");
            renderAisDiag();
            // After 30 s of silence, surface an actionable status message.
            // The branching is in scheduleNoTrafficWarning() so the same
            // logic fires from both initial connect and resubscribe paths.
            scheduleNoTrafficWarning();
          });
          ws.addEventListener("message", function (e) {
            try {
              var msg = JSON.parse(e.data);
              // Error frames from aisstream (malformed subscription, bad key,
              // unverified account, etc.) arrive as a type we need to surface.
              var mt = (msg && (msg.MessageType || msg.messageType || "")).toString();
              state.aisLastMsgType = mt || "(unknown)";
              state.aisMsgTypes[mt || "(unknown)"] = (state.aisMsgTypes[mt || "(unknown)"] || 0) + 1;
              if (state.aisLoggedSamples < 3) {
                state.aisLoggedSamples += 1;
                try { console.log("[ais sample " + state.aisLoggedSamples + "]", msg); } catch (logErr) {}
              }
              if (mt && mt.toLowerCase() === "error") {
                var err = msg.Error || msg.error || msg.message || "unknown";
                aisStatus("AIS CONNECTION ERROR · retrying", "err");
                renderAisDiag();
                return;
              }
              state.aisMessageCount += 1;
              if (state.aisMessageCount === 1) {
                state.aisFirstMsgAt = Date.now();
                if (state.aisNoTrafficTimer) { clearTimeout(state.aisNoTrafficTimer); state.aisNoTrafficTimer = null; }
                aisStatus("AIS STREAMING · " + state.aisMessageCount + " MSG", "ok");
                renderAisDiag();
              } else if (state.aisMessageCount % 10 === 0) {
                aisStatus("AIS STREAMING · " + state.aisMessageCount + " MSG", "ok");
                renderAisDiag();
              }
              var md = msg.MetaData || {};
              var mmsi = md.MMSI || md.MMSI_String;
              if (!mmsi) return;
              var key = String(mmsi);
              var ship = state.ships[key] || (state.ships[key] = { mmsi: key, name: "", lastUpdate: 0 });
              if (md.ShipName) ship.name = md.ShipName.trim();
              if (md.latitude != null && md.longitude != null) {
                ship.lat = md.latitude;
                ship.lon = md.longitude;
                // Reset dead-reckoning base each time a fresh AIS position arrives.
                ship.baseLat = md.latitude;
                ship.baseLon = md.longitude;
                ship.baseAt = Date.now();
              }
              if (msg.MessageType === "PositionReport") {
                var pr = msg.Message && msg.Message.PositionReport;
                if (pr) {
                  if (pr.Sog != null) ship.sog = pr.Sog;
                  if (pr.Cog != null) ship.cog = pr.Cog;
                  if (pr.TrueHeading != null && pr.TrueHeading < 511) ship.heading = pr.TrueHeading;
                  if (pr.NavigationalStatus != null) ship.navStatus = pr.NavigationalStatus;
                }
              } else if (msg.MessageType === "ShipStaticData") {
                var sd = msg.Message && msg.Message.ShipStaticData;
                if (sd) {
                  if (sd.Name) ship.name = sd.Name.trim();
                  if (sd.Type != null) ship.shipType = sd.Type;
                  if (sd.Destination) ship.destination = sd.Destination.trim();
                }
              }
              ship.lastUpdate = Date.now();
              if (ship.lat != null && ship.lon != null) {
                var trackArr = state.shipTracks[key] || (state.shipTracks[key] = []);
                var prev = trackArr.length ? trackArr[trackArr.length - 1] : null;
                if (!prev || Math.abs(prev.lat - ship.lat) > 0.0001 || Math.abs(prev.lon - ship.lon) > 0.0001) {
                  trackArr.push({ lat: ship.lat, lon: ship.lon, t: ship.lastUpdate });
                  if (trackArr.length > 200) trackArr.shift();
                }
              }
            } catch (err) {}
          });
          ws.addEventListener("close", function () {
            state.aisSocket = null;
            if (!state.aisKey) return;
            var attempts = ++state.aisReconnectAttempts;
            var delay = Math.min(30000, 1000 * Math.pow(2, Math.min(attempts, 5)));
            aisStatus("AIS DISCONNECTED · RETRYING IN " + Math.round(delay / 1000) + "S", "err");
            state.aisReconnectTimer = setTimeout(connectAisStream, delay);
          });
          ws.addEventListener("error", function () {
            aisStatus("AIS ERROR · CHECK KEY", "err");
          });
        } catch (err) {
          aisStatus("AIS FAILED · check aisstream key", "err");
        }
      }

      function resubscribeAis() {
        if (!state.aisSocket || state.aisSocket.readyState !== 1) return;
        var bb = aisBboxForCenter();
        try {
          state.aisSocket.send(JSON.stringify({
            APIKey: state.aisKey,
            BoundingBoxes: [[bb[0], bb[1]]]
          }));
          // Reset per-subscription diagnostics: bbox changed → new stream of
          // messages, old counters would be misleading. Also restart the
          // "no traffic after 30 s" downgrade timer.
          state.aisBbox = bb;
          state.aisMessageCount = 0;
          state.aisFirstMsgAt = 0;
          state.aisMsgTypes = {};
          state.aisLastMsgType = "";
          state.aisLoggedSamples = 0;
          scheduleNoTrafficWarning();
          aisStatus("AIS SUBSCRIBED · " +
                    bb[0][0].toFixed(2) + "," + bb[0][1].toFixed(2) + " → " +
                    bb[1][0].toFixed(2) + "," + bb[1][1].toFixed(2), "ok");
          renderAisDiag();
        } catch (e) {}
      }

      function pruneShips() {
        var cutoff = Date.now() - 5 * 60 * 1000;
        var keys = Object.keys(state.ships);
        for (var i = 0; i < keys.length; i++) {
          if (state.ships[keys[i]].lastUpdate < cutoff) delete state.ships[keys[i]];
        }
      }

      function shipsInRange() {
        var out = [];
        var keys = Object.keys(state.ships);
        for (var i = 0; i < keys.length; i++) {
          var s = state.ships[keys[i]];
          if (s.lat == null || s.lon == null) continue;
          var d = haversineNm(state.center.lat, state.center.lon, s.lat, s.lon);
          if (d > state.rangeNm * 1.1) continue;
          s.distNm = d;
          out.push(s);
        }
        out.sort(function (a, b) { return a.distNm - b.distNm; });
        return out;
      }

      function renderShips() {
        var shipLayer = document.getElementById("shipLayer");
        if (!shipLayer) return;
        shipLayer.innerHTML = "";
        if (!state.aisKey) return;
        pruneShips();
        var ships = shipsInRange();
        var svgns = "http://www.w3.org/2000/svg";
        ships.forEach(function (s) {
          // Ship filter chip also applies to the radar, matching the plane
          // filter behaviour. Selected ship is kept by passesShipFilter.
          if (!passesShipFilter(s)) return;
          var pt = project({ lat: s.lat, lon: s.lon });
          if (!isFinite(pt.x) || !isFinite(pt.y)) return;
          var g = document.createElementNS(svgns, "g");
          var heading = s.cog != null ? s.cog : (s.heading != null ? s.heading : 0);
          g.setAttribute("transform", "translate(" + pt.x.toFixed(2) + "," + pt.y.toFixed(2) + ") rotate(" + heading.toFixed(1) + ")");
          g.setAttribute("data-mmsi", s.mmsi);
          g.style.cursor = "pointer";
          var isSel = state.selectedMmsi === s.mmsi;
          var color = isSel ? "#f0c674" : "#ffb347";
          var hit = document.createElementNS(svgns, "circle");
          hit.setAttribute("r", "6"); hit.setAttribute("fill", "transparent");
          g.appendChild(hit);
          var hull = document.createElementNS(svgns, "polygon");
          hull.setAttribute("points", "0,-4.5 2,1 1.5,4 -1.5,4 -2,1");
          hull.setAttribute("fill", color);
          hull.setAttribute("stroke", isSel ? "#fff" : "rgba(7,12,21,0.95)");
          hull.setAttribute("stroke-width", isSel ? "0.6" : "0.5");
          hull.setAttribute("stroke-linejoin", "round");
          g.appendChild(hull);
          g.addEventListener("click", function () { selectShip(s.mmsi); });
          shipLayer.appendChild(g);
        });
      }

      function selectShip(mmsi) {
        if (!mmsi) return;
        if (state.selectedMmsi === mmsi) { deselectAll(); return; }
        if (state.selectedHex) stopSelectedPoll();
        state.selectedHex = null;
        state.selectedPlaneData = null;
        state.lastSelectedPlane = null;
        state.lastSelectedAt = 0;
        state.selectedMmsi = mmsi;
        renderRadar(); renderShips(); renderList(); renderSelected(); renderOverlays();
      }

      var NAV_STATUS_TEXT = [
        "UNDER WAY (ENGINE)", "AT ANCHOR", "NOT UNDER COMMAND",
        "RESTRICTED MANOEUVERABILITY", "CONSTRAINED BY DRAUGHT", "MOORED",
        "AGROUND", "FISHING", "UNDER WAY SAILING", "HSC", "WIG",
        "TOWING ASTERN", "PUSHING AHEAD", "RESERVED", "AIS-SART / MOB / EPIRB", "UNDEFINED"
      ];
      var NAV_STATUS_ALERT = { 2: true, 3: true, 6: true, 14: true };
      function navStatusText(code) {
        if (code == null) return null;
        var n = parseInt(code, 10);
        if (!isFinite(n) || n < 0 || n >= NAV_STATUS_TEXT.length) return null;
        return NAV_STATUS_TEXT[n];
      }

      function initGeo() {
        renderTiles();
        var declined = false;
        try { declined = localStorage.getItem("geo.declined") === "true"; } catch (e) {}
        if (declined || !navigator.geolocation) { fetchNow(); return; }
        setStatus("Acquiring GPS…");
        navigator.geolocation.getCurrentPosition(
          function (pos) {
            state.lastGeo = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            state.center = {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              label: "Current",
              id: "me"
            };
            syncCoordInputs();
            markActivePreset();
            renderTiles();
            fetchNow();
          },
          function (err) {
            if (err && err.code === 1) {
              try { localStorage.setItem("geo.declined", "true"); } catch (e) {}
            }
            fetchNow();
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
        );
      }

      // Re-subscribe AIS + re-render ships after center/range change
      function onCenterOrRangeChanged() {
        resubscribeAis();
        renderShips();
      }
      var _prevOnCenterChanged = onCenterChanged;
      onCenterChanged = function () {
        _prevOnCenterChanged();
        onCenterOrRangeChanged();
      };

      // Dead-reckoning motion tick. Advances every plane's display position
      // forward by 1 s using its own reported track + ground speed. The base
      // (baseLat/baseLon/baseAt) is reset by the bulk fetch handler and
      // pollSelected, so this smooths motion BETWEEN fetches without ever
      // drifting from ground truth by more than one fetch interval. Trails
      // are not affected — accumulateTracks() uses raw-fetched positions.
      //
      // Guardrails: no advance if gsKt/track missing, onGround true, speed
      // < 30 kt, or base is older than 120 s (stale data we shouldn't
      // extrapolate indefinitely).
      function advanceByDR(obj, speedField, headingField, baseOlderThanMs) {
        var spd = obj[speedField];
        var hdg = obj[headingField];
        if (spd == null || hdg == null) return false;
        if (obj.onGround) return false;
        if (spd < 0.3) return false;
        if (obj.baseAt == null) {
          if (!isFinite(obj.lat) || !isFinite(obj.lon)) return false;
          obj.baseAt = Date.now();
          obj.baseLat = obj.lat;
          obj.baseLon = obj.lon;
          return false;
        }
        if (!isFinite(obj.baseLat) || !isFinite(obj.baseLon)) return false;
        var dt = (Date.now() - obj.baseAt) / 1000;
        if (dt <= 0 || dt > (baseOlderThanMs / 1000)) return false;
        var nm = spd * (dt / 3600);
        var rad = hdg * Math.PI / 180;
        var dLat = (nm * Math.cos(rad)) / 60;
        var dLon = (nm * Math.sin(rad)) /
                   (60 * Math.max(0.01, Math.cos(obj.baseLat * Math.PI / 180)));
        var nextLat = obj.baseLat + dLat;
        var nextLon = obj.baseLon + dLon;
        if (!isFinite(nextLat) || !isFinite(nextLon)) return false;
        obj.lat = nextLat;
        obj.lon = nextLon;
        return true;
      }
      function deadReckonTick() {
        var changed = false;
        for (var i = 0; i < state.planes.length; i++) {
          if (advanceByDR(state.planes[i], "gsKt", "trackDeg", 120000)) changed = true;
        }
        if (state.selectedPlaneData) {
          if (advanceByDR(state.selectedPlaneData, "gsKt", "trackDeg", 120000)) changed = true;
        }
        var shipChanged = false;
        var mmsiList = Object.keys(state.ships);
        for (var s = 0; s < mmsiList.length; s++) {
          if (advanceByDR(state.ships[mmsiList[s]], "sog", "cog", 300000)) shipChanged = true;
        }
        if (changed) { renderRadar(); renderOverlays(); }
        if (shipChanged) { renderShips(); }
      }
      setInterval(deadReckonTick, 1000);

      // Re-render ships periodically (since positions don't redraw without it)
      setInterval(function () { if (state.aisKey) renderShips(); }, 5000);

      // Refresh military aircraft registry periodically
      refreshMilitary();
      state.militaryRefreshTimer = setInterval(refreshMilitary, 2 * 60 * 1000);

      // Init
      buildPresets();
      setupAirportSearch();
      setupRadarDrag();
      setupSettings();
      setupLeadPicker();
      setupMapLayerPicker();
      setupTileStatusCopy();
      updateAttributionFooter();
      updateInopStickers();
      // Collapsible controls panel
      (function () {
        var panel = document.getElementById("controlsPanel");
        var toggle = document.getElementById("controlsToggle");
        if (!panel || !toggle) return;
        var collapsed = false;
        try { collapsed = localStorage.getItem("controls.collapsed") === "true"; } catch (e) {}
        if (collapsed) { panel.classList.add("collapsed"); toggle.setAttribute("aria-expanded", "false"); }
        toggle.addEventListener("click", function () {
          var isColl = panel.classList.toggle("collapsed");
          toggle.setAttribute("aria-expanded", isColl ? "false" : "true");
          try { localStorage.setItem("controls.collapsed", isColl ? "true" : "false"); } catch (e) {}
        });
      })();
      // Legend toggle
      (function () {
        var legend = document.getElementById("legend");
        var toggle = document.getElementById("legendToggle");
        if (!legend || !toggle) return;
        var open = false;
        try { open = localStorage.getItem("legend.open") === "true"; } catch (e) {}
        if (open) { legend.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); }
        toggle.addEventListener("click", function () {
          var isOpen = legend.classList.toggle("open");
          toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
          try { localStorage.setItem("legend.open", isOpen ? "true" : "false"); } catch (e) {}
        });
      })();
      syncCoordInputs();
      updateRangeLabels();
      if (state.aisKey) connectAisStream();
      initGeo();
    })();
