Vue.config.devtools = true;

const app = new Vue({
  el: '#app',
  data() {
    return {
      title: '',
      describe: '',
      products: this.loadFromCookies() || [
        {
          name: '',
          cost: '',
          value: '',
          valuePerClient: '',
          costPerClient: 0
        }
      ],
      finalCostPerClient: 0
    };
  },
  watch: {
    products: {
      deep: true,
      handler() {
        this.countFinalCostPerClient();
        this.saveToCookies();
      }
    }
  },
  computed: {
    totalCount() {
      const count = this.products.length;
      const forms = ['товар', 'товара', 'товаров'];
      const cases = [2, 0, 1, 1, 1, 2];
      const index = (count % 100 > 4 && count % 100 < 20) ? 2 : cases[(count % 10 < 5) ? count % 10 : 5];
      console.log('totalCount result:', { count, word: forms[index] });
      return { count, word: forms[index] };
    }
  },
  created() {
    this.countFinalCostPerClient();
  },
  methods: {
    removeItem(index) {
      console.log(index);
      this.products = this.products.filter((_, i) => i !== index);
    },
    addItem(event) {
      event.preventDefault();
      this.products.push({name: '', cost: '', value: '', valuePerClient: '', costPerClient: 0});
      
      this.$nextTick(() => {
        const newElement = this.$refs[`product-${this.products.length - 1}`]?.[0];
        if (newElement) {
          this.smoothScroll(newElement.getBoundingClientRect().top + window.pageYOffset);
        }
      });
    },
    
    smoothScroll(targetPosition) {
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      const duration = 500;
      let start;
      
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const percentage = Math.min(progress / duration, 1);
        window.scrollTo(0, startPosition + distance * this.easeInOutCubic(percentage));
        if (progress < duration) requestAnimationFrame(step);
      };
      
      requestAnimationFrame(step);
    },
    
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    resetData(item) {
      Object.assign(item, {
        name: '',
        cost: '',
        value: '',
        valuePerClient: '',
        costPerClient: 0
      });
    },
    countCostPerClient(item) {
      const { cost, value, valuePerClient } = item;
      if (cost && value && valuePerClient) {
        const parsedCost = parseFloat(cost.toString().replace(',', '.'));
        const parsedValue = parseFloat(value.toString().replace(',', '.'));
        const parsedValuePerClient = parseFloat(valuePerClient.toString().replace(',', '.'));
        item.costPerClient = Math.round((parsedCost / parsedValue) * parsedValuePerClient);
      }
      this.countFinalCostPerClient();
    },
    countFinalCostPerClient() {
      this.finalCostPerClient = this.products.reduce((sum, item) => sum + Number(item.costPerClient || 0), 0);
    },
    saveToCookies() {
      const productsJson = JSON.stringify(this.products);
      document.cookie = `products=${encodeURIComponent(productsJson)}; expires=${new Date(Date.now() + 86400000).toUTCString()}; path=/`;
    },
    loadFromCookies() {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'products') {
          return JSON.parse(decodeURIComponent(value));
        }
      }
      return null;
    },
    shareToTelegram() {
      const text = this.generateShareText();
      const encodedText = encodeURIComponent(text);
      window.open(`https://t.me/share/url?url=${encodedText}`, '_blank');
    },
    downloadTextFile() {
      const text = this.generateShareText();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'расчет-себестоимости.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    generateShareText() {
      let text = '📊 Расчет себестоимости\n\n';
      
      this.products.forEach((item, index) => {
        if (item.name || item.costPerClient) {
          text += `${index + 1}. ${item.name || 'Товар'}\n`;
          text += `   💰 Стоимость: ${item.cost || 0}₽\n`;
          text += `   📦 Объем: ${item.value || 0}\n`;
          text += `   👤 Расход на клиента: ${item.valuePerClient || 0}\n`;
          text += `   💵 Стоимость на клиента: ${item.costPerClient || 0}₽\n\n`;
        }
      });

      text += `\n🔥 Итого на клиента: ${this.finalCostPerClient}₽\n`;
      text += '\nСоздано с помощью https://dev-postnov.ru/projects/cost-calc/';
      
      return text;
    }
  }
});

let hasShownAlert = false;

document.addEventListener('mouseleave', function(e) {
    if (e.clientY <= 0 && !hasShownAlert) { // Курсор вышел через верхнюю границу страницы
        alert('Мы сохраняем данные, но при очистке кэша они могут пропасть. Мы сделали выгрузку в телеграм или в txt-файл. Воспользуйтесь ими, чтобы не потерять данные');
        hasShownAlert = true; // Чтобы показать предупреждение только один раз
        
        // Сбросим флаг через некоторое время, чтобы можно было показать предупреждение снова
        setTimeout(() => {
            hasShownAlert = false;
        }, 5000);
    }
});
