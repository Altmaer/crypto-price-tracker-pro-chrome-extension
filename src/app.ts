import config from './constants/index.json';

import './css/styles.css';

const cardsWrapper = document.querySelector('.cards');
const toggleSettingsMenuButtons = document.querySelectorAll('[data-action="settings-toggle"]');
const settingsSection = document.querySelector('.settings-section');
const coinListWrapper = document.querySelector('.coin-list');
const supportedCoinsNumber = document.querySelector('.supported-coins-number');
const searchCoinsInput = document.querySelector('.search-coins-input');

if (cardsWrapper === null) {
  throw new Error('No cards wrapper');
}

if (coinListWrapper === null) {
  throw new Error('No coin list wrapper');
}

export type Coins = ICoin[];

export interface ICoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply?: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi?: Roi;
  last_updated: string;
}

export interface Roi {
  times: number;
  currency: string;
  percentage: number;
}

export interface Error {
  status: IErrorStatus
}

export interface IErrorStatus {
  error_code: number
  error_message: string
}

export type CoinList = ICoin[]

export interface ICoin {
  id: string
  symbol: string
  name: string
}


const formatValue = (initialValue: number, shouldRemoveMinus = false) => {
  const value = shouldRemoveMinus === true ? removeMinus(initialValue) : initialValue;

  if (value <= 0.0001) {
    const convertedNumber = initialValue?.toFixed(8);

    return `$${convertedNumber}`
  }
  

  if (value > 1_000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const putCacheToLocalStorage = (key: string, data: unknown) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getCacheFromLocalStorage = <T,>(key: string) => {
  const data = localStorage.getItem(key)

  if (data === null) {
    return null
  }

  return JSON.parse(data) as null | T;
};

const isMoreThan10Minutes = (date: number) => {
  const currentDate = Date.now();
  const timeDifference = currentDate - date;
  const tenMinutesInMillis = 10 * 60 * 1000;

  return timeDifference > tenMinutesInMillis;
}

const removeMinus = (number: number) => {
  return Math.abs(number);
};

const roundAndRemoveMinus = (number: number) => {
  const positiveNumber = removeMinus(number);
  const roundedNumber = Math.round(positiveNumber * 100) / 100;

  return roundedNumber;
}

const getPriceChangeColorClass = (number: number) => {
  switch (Math.sign(number)) {
    case 1:
      return 'bump';
    case -1:
      return 'fall';
    default:
      return '';
  }
}

const debounce = (callback: Function, milliseconds: number) => {
  let timeout: NodeJS.Timeout;

  return (argument: unknown) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(argument), milliseconds);
  };
};

const removeFromLocalStorage = (key: string) => {
  localStorage.removeItem(key);
};

const API_DATA_STORAGE_KEY = '__coingecko_data';
const API_DATA_TIMESTAMP_STORAGE_KEY = '__coingecko_data_timestamp';
const API_COINS_LIST = '__coingecko_coins_list';

const getCoinsList = () => {
  const localStorageCoins = getCacheFromLocalStorage<string[]>(API_COINS_LIST);
  const list = localStorageCoins ?? config.DEFAULT_COINGECKO_COIN_IDS;

  if (localStorageCoins === null) {
    putCacheToLocalStorage(API_COINS_LIST, config.DEFAULT_COINGECKO_COIN_IDS);
  }

  return list;
};

const launch = () => {
  const data = getCacheFromLocalStorage<Coins>(API_DATA_STORAGE_KEY);
  const dataTimestamp = getCacheFromLocalStorage<string>(API_DATA_TIMESTAMP_STORAGE_KEY);
  const isExpired = dataTimestamp == null || isMoreThan10Minutes(+dataTimestamp);

  if (data !== null && isExpired === false) {
    return renderData(data);
  }

  const coinsList = getCoinsList().join(',');

const API_URL =
  `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&sparkline=false&locale=en&ids=${coinsList}`;

  fetch(API_URL)
    .then((res) => res.json())
    .then((data: Coins) => {
      putCacheToLocalStorage(API_DATA_STORAGE_KEY, data);
      putCacheToLocalStorage(API_DATA_TIMESTAMP_STORAGE_KEY, Date.now());

      renderData(data);
    })
    .catch((error) => {
      console.error('error', error);

      cardsWrapper.textContent = '';
      cardsWrapper.insertAdjacentHTML(
        'afterbegin',
        `
    <div>Error</div>
  `
      );
    });
};

const renderData = (data: Coins) => {
  data.forEach((coin, index) => {
    const {
      name,
      image,
      current_price: currentPrice,
      price_change_percentage_24h: priceChangePercent,
      symbol,
      market_cap: marketCap,
      market_cap_rank: marketCapRank,
      fully_diluted_valuation: fullyDilutedValuation,
      total_volume: totalVolume,
      high_24h: high24h,
      low_24h: low24h,
      price_change_24h: priceChange24h,
      market_cap_change_24h: marketCapChange24h,
      market_cap_change_percentage_24h: marketCapPercentChange24h,
      circulating_supply: circulatingSupply,
      total_supply: totalSupply,
      max_supply: maxSupply,
      ath,
      ath_change_percentage: athChangePercentage,
      atl,
      atl_change_percentage: atlChangePercentage,
    } = coin;

    if (index === 0) {
      cardsWrapper.textContent = '';
    }

    cardsWrapper.insertAdjacentHTML(
      'beforeend',
      `
<li class="coin">
  <div class="wrapper" title="${name}">
    <span class="image">
      <img src="${image}" width="30" height="30" alt="${name} image" />
    </span>
    <span class="price ${getPriceChangeColorClass(priceChangePercent)}">${roundAndRemoveMinus(priceChangePercent)}%</span>
    <span class="cap">${formatValue(currentPrice)}</span>
  </div>
  <div class="stat">
    <ul class="stat-list">
      <li class="stat-item"><span>Name</span><span>${name}</span></li>
      <li class="stat-item"><span>Symbol</span><span>${symbol}</span></li>
      <li class="stat-item"><span>Market cap rank</span><span>${marketCapRank}</span></li>
      <li class="stat-item"><span>Price</span><span>${formatValue(currentPrice)}</span></li>
      <li class="stat-item column"><span>Market cap</span><span>${formatValue(marketCap)}</span></li>
      <li class="stat-item column"><span>Fully diluted valuation</span><span>${formatValue(fullyDilutedValuation)}</span></li>
      <li class="stat-item column"><span>Total volume</span><span>${formatValue(totalVolume)}</span></li>
      <li class="stat-item column"><span>Highest price in 24h</span><span>${formatValue(high24h)}</span></li>
      <li class="stat-item column"><span>Lowest price in 24h</span><span>${formatValue(low24h)}</span></li>
      <li class="stat-item column"><span>Price change in 24h</span><span>${formatValue(priceChange24h)}</span></li>
      <li class="stat-item column"><span>Market cap change in 24h</span><span class="${getPriceChangeColorClass(priceChangePercent)}">${formatValue(marketCapChange24h, true)}</span></li>
      <li class="stat-item column"><span>Market cap percent change in 24h</span><span class="${getPriceChangeColorClass(priceChangePercent)}">${roundAndRemoveMinus(marketCapPercentChange24h)}%</span></li>
      <li class="stat-item column"><span>Circulating supply</span><span>${formatValue(circulatingSupply)}</span></li>
      <li class="stat-item column"><span>Total supply</span><span>${formatValue(totalSupply)}</span></li>
      ${maxSupply !== undefined ? `<li class="stat-item column"><span>Total supply</span><span>${formatValue(maxSupply)}</span></li>` : ''}
      <li class="stat-item column"><span>All-time highest price</span><span>${formatValue(ath)}</span></li>
      <li class="stat-item column"><span>All-time highest price change percentage</span><span class="${getPriceChangeColorClass(athChangePercentage)}">${roundAndRemoveMinus(athChangePercentage)}%</span></li>
      <li class="stat-item column"><span>All-time low price</span><span>${formatValue(atl)}</span></li>
      <li class="stat-item column"><span>All-time low price change percentage</span><span class="${getPriceChangeColorClass(atlChangePercentage)}">${roundAndRemoveMinus(atlChangePercentage)}%</span></li>
    </ul>
  </div>
</li>
`
    );
  });
}

launch();

const toggleCardsStat = () => {
  cardsWrapper.addEventListener('click', ({ target }) => {
    if (target === null) {
      return;
    }

    (target as HTMLElement).closest('.coin')?.querySelector('.stat')?.classList.toggle('open');
  });
};

toggleCardsStat();

const toggleSettingsMenu = () => {
  toggleSettingsMenuButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const isOpen = settingsSection?.classList?.contains('open')

      if (isOpen === false) {
        fetchCoingeckoCoinList();
      }

      if (isOpen === true) {
        if (searchCoinsInput !== null) {
          (searchCoinsInput as HTMLInputElement).value = '';
        }

        launch();
      }

      settingsSection?.classList?.toggle('open');
    });
  });
};

const fetchCoingeckoCoinList = () => {
  fetch('https://api.coingecko.com/api/v3/coins/list')
  .then((res) => res.json())
  .then((data: CoinList) => {
    if (supportedCoinsNumber !== null) {
      supportedCoinsNumber.textContent = `${data.length}`;
      supportedCoinsNumber.closest('p')?.classList?.add('show');
    }
    

    const list: CoinList = [];

    const selectedCoinIds = getCacheFromLocalStorage<string[]>(API_COINS_LIST);

    if (selectedCoinIds !== null) {
      selectedCoinIds.forEach((coinId) => {
        const coin = data.find(({ id }) => id === coinId);

        if (coin === undefined) {
          return;
        }

        list.push(coin);
      });
    }

    data.forEach((coin) => {
      const selected = selectedCoinIds?.includes(coin.id);

      if (selected === true) {
        return
      }

      list.push(coin);
    });

    list.forEach(({ id, symbol, name }, index) => {
      if (index === 0) {
        coinListWrapper.textContent = '';
      }

      coinListWrapper.insertAdjacentHTML(
        'beforeend',
        `
        <li data-coingecko-id="${id}" class="coin-list-item">
          <div class="coin-list-info">
            <div class="coin-info-name">${name}</div>
            <div class="coin-info-symbol">${symbol}</div>
          </div>
          <div class="coin-list-status">
            <input type="checkbox" ${selectedCoinIds?.includes(id) === true ? 'checked' : ''} />
          </div>
        </li>
        `
      );
    })
  })
  .catch((error) => {
    console.error(error);

    coinListWrapper.textContent = '';
    coinListWrapper.insertAdjacentHTML(
      'afterbegin',
      `<div>Error fetching coin list</div>`
    );
  });
};

toggleSettingsMenu();

const handleSearchCoinsInput = () => {
  const handler = (event: Event) => {
    const list = coinListWrapper.querySelectorAll<HTMLElement>('.coin-list-item');

    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();

    if (value === '') {
      list.forEach((item) => {
        item.style.display = 'block';
      });

      return;
    }

    list.forEach((item) => {
      const id = item.getAttribute('data-coingecko-id')?.trim().toLowerCase();
      const name = item
        .querySelector('.coin-info-name')
        ?.textContent?.trim()
        .toLowerCase();
      const symbol = item
        .querySelector('.coin-info-symbol')
        ?.textContent?.trim()
        .toLowerCase();

      const matches =
        id?.startsWith(value) ||
        name?.startsWith(value) ||
        symbol?.startsWith(value);

      if (matches !== true) {
        item.style.display = 'none';

        return;
      }

      item.style.display = 'block';
    });
  };

  searchCoinsInput?.addEventListener('keyup', debounce(handler, 150));
};

handleSearchCoinsInput();

const handleCoinSelect = () => {
  coinListWrapper.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement)

    if (target.tagName !== 'INPUT') {
      return
    }
    
    const coinId = target.closest('.coin-list-item')?.getAttribute('data-coingecko-id');
    const isChecked = (target as HTMLInputElement).checked;

    if (coinId === undefined) {
      return;
    }

    const currentSelectedCoins = getCacheFromLocalStorage<string[]>(API_COINS_LIST);

    if (currentSelectedCoins === null) {
      return;
    }

    removeFromLocalStorage(API_DATA_STORAGE_KEY);
    removeFromLocalStorage(API_DATA_TIMESTAMP_STORAGE_KEY);

    // Add
    if (isChecked === true) {
      const newList = [...currentSelectedCoins, coinId]

      putCacheToLocalStorage(API_COINS_LIST, newList);

      return;
    }

    // Remove
    const newList = currentSelectedCoins.filter((coin) => coin !== coinId);

    putCacheToLocalStorage(API_COINS_LIST, newList);
  });
};

handleCoinSelect();
