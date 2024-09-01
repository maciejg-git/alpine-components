document.addEventListener('alpine:init', () => {
  Alpine.data('datepicker', (defaults = {}) => {
    let getNumberRange = (from, count) => {
      return Array.from({ length: count }, (_, i) => i + from);
    };

    let pad = (d) => (d < 10 ? "0" + d : d);

    let getCountDaysInMonth = (y, m) => 32 - new Date(y, m, 32).getDate();

    let prevMonth = (m, y) => {
      return m - 1 < 0 ? { m: 11, y: y - 1 } : { m: m - 1, y };
    };

    let nextMonth = (m, y) => {
      return m + 1 > 11 ? { m: 0, y: y + 1 } : { m: m + 1, y };
    };

    let getFirstDay = (m, y, mondayFirstWeekday) => {
      let d = new Date(m, y).getDay();
      return mondayFirstWeekday ? (6 + d) % 7 : d;
    };

    let parseDate = (d) => d.split("-").map((i) => +i);

    let isDate = (d) => Object.prototype.toString.call(d) === "[object Date]";

    let isMonthValid = (m) => typeof m === "number" && m <= 11 && m >= 0;

    let isYearValid = (y) => typeof y === "number";
    
    let rangeSelectionStates = {
      UNSELECTED: 0,
      FROM_SELECTED: 1,
      TO_SELECTED: 2,
    }
    
    return {
      today: new Date(),
      month: null,
      year: null,
      names: {
        months: null,
        weekdays: null,
      },
      props: {
        locale: defaults.locale ?? 'en-GB',
        mondayFirstWeekday: defaults.mondayFirstWeekday ?? true,
        adjacentMonthsDays: defaults.adjacentMonthsDays ?? true,
        range: defaults.range ?? true,
        modelFormat: defaults.modelFormat ?? 'date',
      },
      model: null,
      selectedSingle: null,
      selectedRange: [],
      rangeState: 0,
      mouseOverDate: null,

      init() {
        this.today.setHours(0, 0, 0, 0);
        this.month = this.today.getMonth()
        this.year = this.today.getFullYear()
        this.names.months = Array.from({ length: 12 }, (v, i) =>
          new Date(0, i, 1).toLocaleString(this.props.locale, {
            month: "short",
          })
        )
        this.names.weekdays = Array.from({ length: 7 }, (v, i) =>
          new Date(2021, 1, this.props.mondayFirstWeekday ? i + 1 : i).toLocaleString(
            this.props.locale,
            {
              weekday: "short",
            }
          )
        )
        Alpine.bind(this.$el, {
          ['x-modelable']: 'model'
        })
      },
      dateToModelFormat(date) {
        let format = this.props.modelFormat
        if (format === 'date') {
          return date
        }
        if (format === 'array') {
          return [date.getFullYear(), date.getMonth(), date.getDate()]
        }
        if (format === 'string') {
          return [date.getFullYear(), date.getMonth(), date.getDate()].join('-')
        }
      },
      todayFormatted() {
        return this.today.toLocaleDateString(this.props.locale, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      },
      setNextMonth() {
        ({ m: this.month, y: this.year } = nextMonth(
          this.month,
          this.year
        ));
      },
      setPrevMonth() {
        ({ m: this.month, y: this.year } = prevMonth(
          this.month,
          this.year
        ));
      },
      setNextYear() {
        this.year++
      },
      setPrevYear() {
        this.year--
      },
      weekdays() {
        return this.names.weekdays
      },
      days() {
        let day = getFirstDay(this.year, this.month, this.props.mondayFirstWeekday);
        let daysInMonth = getCountDaysInMonth(this.year, this.month);

        let days = getNumberRange(1, daysInMonth);
        days = days.map((i) => new Date(this.year, this.month, i));

        let { m, y } = prevMonth(this.month, this.year);

        let daysCountPrev = getCountDaysInMonth(y, m);

        let prevMonthDays = getNumberRange(daysCountPrev - day + 1, day);
        if (!this.props.adjacentMonthsDays) {
          prevMonthDays = prevMonthDays.map((i) => "");
        } else {
          prevMonthDays = prevMonthDays.map((i) => new Date(y, m, i))
        }

        ({m, y} = nextMonth(this.month, this.year))

        let daysCountNext = 42 - daysInMonth - day

        let nextMonthDays = null

        if (!this.props.adjacentMonthsDays) {
          nextMonthDays = []
        } else {
          nextMonthDays = getNumberRange(1, daysCountNext)
          nextMonthDays = nextMonthDays.map((i) => new Date(y, m, i))
        }

        return [...prevMonthDays, ...days, ...nextMonthDays];
      },
      currentDate() {
        return `${this.names.months[this.month]} ${this.year}`
      },
      reset() {
        this.selectedSingle = ""
        this.selectedRange = []
        this.model = null
        this.rangeState = rangeSelectionStates.UNSELECTED
        this.mouseOverDate = null
      },
      addRange() {
        if (this.rangeState === rangeSelectionStates.TO_SELECTED) {
          this.selectedRange = []
          this.rangeState = rangeSelectionStates.UNSELECTED
        }
        this.selectedRange[this.rangeState] = this.d
        this.rangeState++
        if (this.rangeState === rangeSelectionStates.TO_SELECTED) {
          if (this.selectedRange[0] > this.selectedRange[1]) {
            this.selectedRange.reverse()
          }
        }
      },
      isToday() {
        return this.today.getTime() == this.d.getTime()
      },
      isAdjacent() {
        return this.d.getMonth() !== this.month
      },
      isSelected() {
        return this.selectedSingle && this.selectedSingle.getTime() == this.d.getTime()
      },
      isSelectedRange() {
        if (this.props.range && this.rangeState === rangeSelectionStates.TO_SELECTED) {
          return this.selectedRange[0] <= this.d && this.d <= this.selectedRange[1]
        }
        return false
      },
      isPartiallySelected() {
        if (this.props.range && this.rangeState === rangeSelectionStates.FROM_SELECTED) {
          return (this.mouseOverDate >= this.d && this.d >= this.selectedRange[0]) ||
            (this.mouseOverDate <= this.d && this.d <= this.selectedRange[0])
        }
        return false
      },
      handleDayClick() {
        if (this.isAdjacent()) {
          this.month = this.d.getMonth()
          this.year = this.d.getFullYear()
        }
        if (this.props.range) {
          this.addRange()
          this.model = this.selectedRange.map((d) => this.dateToModelFormat(d))
          return
        }
        this.selectedSingle = this.d
        this.model = this.selectedSingle
      },
      prevMonthButton: {
        ['@click']() {
          this.setPrevMonth()
        }
      },
      nextMonthButton: {
        ['@click']() {
          this.setNextMonth()
        }
      },
      prevYearButton: {
        ['@click']() {
          this.setPrevYear()
        }
      },
      nextYearButton: {
        ['@click']() {
          this.setNextYear()
        }
      },
      day: {
        [':class']() {
          let classes = this.$el.attributes
          let c = ""
          if (this.isAdjacent()) {
            return (classes['class:adjacent']?.textContent || '')
          }

          if (this.isSelected()) {
            c += (classes['class:selected']?.textContent || '') + ' '
          } else if (this.isSelectedRange()) {
            c += (classes['class:selected-range']?.textContent || '') + ' '
          } else if (this.isPartiallySelected()) {
            c += (classes['class:partially-selected']?.textContent || '') + ' '
          }

          if (this.isToday()) {
            c += (classes['class:today']?.textContent || '') + ' '
          }

          return c
        },
        ['@click']() {
          this.handleDayClick()
        },
        ['@mouseenter']() {
          this.mouseOverDate = this.d
        }
      }
    }
  })
})
