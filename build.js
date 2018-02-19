/*
 *  big.js v5.0.3
 *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
 *  Copyright (c) 2017 Michael Mclaughlin <M8ch88l@gmail.com>
 *  https://github.com/MikeMcl/big.js/LICENCE
 */
;(function (GLOBAL) {
  'use strict';
  var Big,


/************************************** EDITABLE DEFAULTS *****************************************/


    // The default values below must be integers within the stated ranges.

    /*
     * The maximum number of decimal places (DP) of the results of operations involving division:
     * div and sqrt, and pow with negative exponents.
     */
    DP = 20,          // 0 to MAX_DP

    /*
     * The rounding mode (RM) used when rounding to the above decimal places.
     *
     *  0  Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
     *  1  To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
     *  2  To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
     *  3  Away from zero.                                  (ROUND_UP)
     */
    RM = 1,             // 0, 1, 2 or 3

    // The maximum value of DP and Big.DP.
    MAX_DP = 1E6,       // 0 to 1000000

    // The maximum magnitude of the exponent argument to the pow method.
    MAX_POWER = 1E6,    // 1 to 1000000

    /*
     * The negative exponent (NE) at and beneath which toString returns exponential notation.
     * (JavaScript numbers: -7)
     * -1000000 is the minimum recommended exponent value of a Big.
     */
    NE = -7,            // 0 to -1000000

    /*
     * The positive exponent (PE) at and above which toString returns exponential notation.
     * (JavaScript numbers: 21)
     * 1000000 is the maximum recommended exponent value of a Big.
     * (This limit is not enforced or checked.)
     */
    PE = 21,            // 0 to 1000000


/**************************************************************************************************/


    // Error messages.
    NAME = '[big.js] ',
    INVALID = NAME + 'Invalid ',
    INVALID_DP = INVALID + 'decimal places',
    INVALID_RM = INVALID + 'rounding mode',
    DIV_BY_ZERO = NAME + 'Division by zero',

    // The shared prototype object.
    P = {},
    UNDEFINED = void 0,
    NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;


  /*
   * Create and return a Big constructor.
   *
   */
  function _Big_() {

    /*
     * The Big constructor and exported function.
     * Create and return a new instance of a Big number object.
     *
     * n {number|string|Big} A numeric value.
     */
    function Big(n) {
      var x = this;

      // Enable constructor usage without new.
      if (!(x instanceof Big)) return n === UNDEFINED ? _Big_() : new Big(n);

      // Duplicate.
      if (n instanceof Big) {
        x.s = n.s;
        x.e = n.e;
        x.c = n.c.slice();
      } else {
        parse(x, n);
      }

      /*
       * Retain a reference to this Big constructor, and shadow Big.prototype.constructor which
       * points to Object.
       */
      x.constructor = Big;
    }

    Big.prototype = P;
    Big.DP = DP;
    Big.RM = RM;
    Big.NE = NE;
    Big.PE = PE;
    Big.version = '5.0.2';

    return Big;
  }


  /*
   * Parse the number or string value passed to a Big constructor.
   *
   * x {Big} A Big number instance.
   * n {number|string} A numeric value.
   */
  function parse(x, n) {
    var e, i, nl;

    // Minus zero?
    if (n === 0 && 1 / n < 0) n = '-0';
    else if (!NUMERIC.test(n += '')) throw Error(INVALID + 'number');

    // Determine sign.
    x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

    // Decimal point?
    if ((e = n.indexOf('.')) > -1) n = n.replace('.', '');

    // Exponential form?
    if ((i = n.search(/e/i)) > 0) {

      // Determine exponent.
      if (e < 0) e = i;
      e += +n.slice(i + 1);
      n = n.substring(0, i);
    } else if (e < 0) {

      // Integer.
      e = n.length;
    }

    nl = n.length;

    // Determine leading zeros.
    for (i = 0; i < nl && n.charAt(i) == '0';) ++i;

    if (i == nl) {

      // Zero.
      x.c = [x.e = 0];
    } else {

      // Determine trailing zeros.
      for (; nl > 0 && n.charAt(--nl) == '0';);
      x.e = e - i - 1;
      x.c = [];

      // Convert string to array of digits without leading/trailing zeros.
      for (e = 0; i <= nl;) x.c[e++] = +n.charAt(i++);
    }

    return x;
  }


  /*
   * Round Big x to a maximum of dp decimal places using rounding mode rm.
   * Called by stringify, P.div, P.round and P.sqrt.
   *
   * x {Big} The Big to round.
   * dp {number} Integer, 0 to MAX_DP inclusive.
   * rm {number} 0, 1, 2 or 3 (DOWN, HALF_UP, HALF_EVEN, UP)
   * [more] {boolean} Whether the result of division was truncated.
   */
  function round(x, dp, rm, more) {
    var xc = x.c,
      i = x.e + dp + 1;

    if (i < xc.length) {
      if (rm === 1) {

        // xc[i] is the digit after the digit that may be rounded up.
        more = xc[i] >= 5;
      } else if (rm === 2) {
        more = xc[i] > 5 || xc[i] == 5 &&
          (more || i < 0 || xc[i + 1] !== UNDEFINED || xc[i - 1] & 1);
      } else if (rm === 3) {
        more = more || xc[i] !== UNDEFINED || i < 0;
      } else {
        more = false;
        if (rm !== 0) throw Error(INVALID_RM);
      }

      if (i < 1) {
        xc.length = 1;

        if (more) {

          // 1, 0.1, 0.01, 0.001, 0.0001 etc.
          x.e = -dp;
          xc[0] = 1;
        } else {

          // Zero.
          xc[0] = x.e = 0;
        }
      } else {

        // Remove any digits after the required decimal places.
        xc.length = i--;

        // Round up?
        if (more) {

          // Rounding up may mean the previous digit has to be rounded up.
          for (; ++xc[i] > 9;) {
            xc[i] = 0;
            if (!i--) {
              ++x.e;
              xc.unshift(1);
            }
          }
        }

        // Remove trailing zeros.
        for (i = xc.length; !xc[--i];) xc.pop();
      }
    } else if (rm < 0 || rm > 3 || rm !== ~~rm) {
      throw Error(INVALID_RM);
    }

    return x;
  }


  /*
   * Return a string representing the value of Big x in normal or exponential notation.
   * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
   *
   * x {Big}
   * id? {number} Caller id.
   *         1 toExponential
   *         2 toFixed
   *         3 toPrecision
   *         4 valueOf
   * n? {number|undefined} Caller's argument.
   * k? {number|undefined}
   */
  function stringify(x, id, n, k) {
    var e, s,
      Big = x.constructor,
      z = !x.c[0];

    if (n !== UNDEFINED) {
      if (n !== ~~n || n < (id == 3) || n > MAX_DP) {
        throw Error(id == 3 ? INVALID + 'precision' : INVALID_DP);
      }

      x = new Big(x);

      // The index of the digit that may be rounded up.
      n = k - x.e;

      // Round?
      if (x.c.length > ++k) round(x, n, Big.RM);

      // toFixed: recalculate k as x.e may have changed if value rounded up.
      if (id == 2) k = x.e + n + 1;

      // Append zeros?
      for (; x.c.length < k;) x.c.push(0);
    }

    e = x.e;
    s = x.c.join('');
    n = s.length;

    // Exponential notation?
    if (id != 2 && (id == 1 || id == 3 && k <= e || e <= Big.NE || e >= Big.PE)) {
      s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

    // Normal notation.
    } else if (e < 0) {
      for (; ++e;) s = '0' + s;
      s = '0.' + s;
    } else if (e > 0) {
      if (++e > n) for (e -= n; e--;) s += '0';
      else if (e < n) s = s.slice(0, e) + '.' + s.slice(e);
    } else if (n > 1) {
      s = s.charAt(0) + '.' + s.slice(1);
    }

    return x.s < 0 && (!z || id == 4) ? '-' + s : s;
  }


  // Prototype/instance methods


  /*
   * Return a new Big whose value is the absolute value of this Big.
   */
  P.abs = function () {
    var x = new this.constructor(this);
    x.s = 1;
    return x;
  };


  /*
   * Return 1 if the value of this Big is greater than the value of Big y,
   *       -1 if the value of this Big is less than the value of Big y, or
   *        0 if they have the same value.
  */
  P.cmp = function (y) {
    var isneg,
      x = this,
      xc = x.c,
      yc = (y = new x.constructor(y)).c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either zero?
    if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    isneg = i < 0;

    // Compare exponents.
    if (k != l) return k > l ^ isneg ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = -1; ++i < j;) {
      if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
    }

    // Compare lengths.
    return k == l ? 0 : k > l ^ isneg ? 1 : -1;
  };


  /*
   * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
   * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
  P.div = function (y) {
    var x = this,
      Big = x.constructor,
      a = x.c,                  // dividend
      b = (y = new Big(y)).c,   // divisor
      k = x.s == y.s ? 1 : -1,
      dp = Big.DP;

    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);

    // Divisor is zero?
    if (!b[0]) throw Error(DIV_BY_ZERO);

    // Dividend is 0? Return +-0.
    if (!a[0]) return new Big(k * 0);

    var bl, bt, n, cmp, ri,
      bz = b.slice(),
      ai = bl = b.length,
      al = a.length,
      r = a.slice(0, bl),   // remainder
      rl = r.length,
      q = y,                // quotient
      qc = q.c = [],
      qi = 0,
      d = dp + (q.e = x.e - y.e) + 1;    // number of digits of the result

    q.s = k;
    k = d < 0 ? 0 : d;

    // Create version of divisor with leading zero.
    bz.unshift(0);

    // Add zeros to make remainder as long as divisor.
    for (; rl++ < bl;) r.push(0);

    do {

      // n is how many times the divisor goes into current remainder.
      for (n = 0; n < 10; n++) {

        // Compare divisor and remainder.
        if (bl != (rl = r.length)) {
          cmp = bl > rl ? 1 : -1;
        } else {
          for (ri = -1, cmp = 0; ++ri < bl;) {
            if (b[ri] != r[ri]) {
              cmp = b[ri] > r[ri] ? 1 : -1;
              break;
            }
          }
        }

        // If divisor < remainder, subtract divisor from remainder.
        if (cmp < 0) {

          // Remainder can't be more than 1 digit longer than divisor.
          // Equalise lengths using divisor with extra leading zero?
          for (bt = rl == bl ? b : bz; rl;) {
            if (r[--rl] < bt[rl]) {
              ri = rl;
              for (; ri && !r[--ri];) r[ri] = 9;
              --r[ri];
              r[rl] += 10;
            }
            r[rl] -= bt[rl];
          }

          for (; !r[0];) r.shift();
        } else {
          break;
        }
      }

      // Add the digit n to the result array.
      qc[qi++] = cmp ? n : ++n;

      // Update the remainder.
      if (r[0] && cmp) r[rl] = a[ai] || 0;
      else r = [a[ai]];

    } while ((ai++ < al || r[0] !== UNDEFINED) && k--);

    // Leading zero? Do not remove if result is simply zero (qi == 1).
    if (!qc[0] && qi != 1) {

      // There can't be more than one zero.
      qc.shift();
      q.e--;
    }

    // Round?
    if (qi > d) round(q, dp, Big.RM, r[0] !== UNDEFINED);

    return q;
  };


  /*
   * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
   */
  P.eq = function (y) {
    return !this.cmp(y);
  };


  /*
   * Return true if the value of this Big is greater than the value of Big y, otherwise return
   * false.
   */
  P.gt = function (y) {
    return this.cmp(y) > 0;
  };


  /*
   * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
   * return false.
   */
  P.gte = function (y) {
    return this.cmp(y) > -1;
  };


  /*
   * Return true if the value of this Big is less than the value of Big y, otherwise return false.
   */
  P.lt = function (y) {
    return this.cmp(y) < 0;
  };


  /*
   * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
   * return false.
   */
  P.lte = function (y) {
    return this.cmp(y) < 1;
  };


  /*
   * Return a new Big whose value is the value of this Big minus the value of Big y.
   */
  P.minus = P.sub = function (y) {
    var i, j, t, xlty,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    // Signs differ?
    if (a != b) {
      y.s = -b;
      return x.plus(y);
    }

    var xc = x.c.slice(),
      xe = x.e,
      yc = y.c,
      ye = y.e;

    // Either zero?
    if (!xc[0] || !yc[0]) {

      // y is non-zero? x is non-zero? Or both are zero.
      return yc[0] ? (y.s = -b, y) : new Big(xc[0] ? x : 0);
    }

    // Determine which is the bigger number. Prepend zeros to equalise exponents.
    if (a = xe - ye) {

      if (xlty = a < 0) {
        a = -a;
        t = xc;
      } else {
        ye = xe;
        t = yc;
      }

      t.reverse();
      for (b = a; b--;) t.push(0);
      t.reverse();
    } else {

      // Exponents equal. Check digit by digit.
      j = ((xlty = xc.length < yc.length) ? xc : yc).length;

      for (a = b = 0; b < j; b++) {
        if (xc[b] != yc[b]) {
          xlty = xc[b] < yc[b];
          break;
        }
      }
    }

    // x < y? Point xc to the array of the bigger number.
    if (xlty) {
      t = xc;
      xc = yc;
      yc = t;
      y.s = -y.s;
    }

    /*
     * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
     * needs to start at yc.length.
     */
    if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;

    // Subtract yc from xc.
    for (b = i; j > a;) {
      if (xc[--j] < yc[j]) {
        for (i = j; i && !xc[--i];) xc[i] = 9;
        --xc[i];
        xc[j] += 10;
      }

      xc[j] -= yc[j];
    }

    // Remove trailing zeros.
    for (; xc[--b] === 0;) xc.pop();

    // Remove leading zeros and adjust exponent accordingly.
    for (; xc[0] === 0;) {
      xc.shift();
      --ye;
    }

    if (!xc[0]) {

      // n - n = +0
      y.s = 1;

      // Result must be zero.
      xc = [ye = 0];
    }

    y.c = xc;
    y.e = ye;

    return y;
  };


  /*
   * Return a new Big whose value is the value of this Big modulo the value of Big y.
   */
  P.mod = function (y) {
    var ygtx,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    if (!y.c[0]) throw Error(DIV_BY_ZERO);

    x.s = y.s = 1;
    ygtx = y.cmp(x) == 1;
    x.s = a;
    y.s = b;

    if (ygtx) return new Big(x);

    a = Big.DP;
    b = Big.RM;
    Big.DP = Big.RM = 0;
    x = x.div(y);
    Big.DP = a;
    Big.RM = b;

    return this.minus(x.times(y));
  };


  /*
   * Return a new Big whose value is the value of this Big plus the value of Big y.
   */
  P.plus = P.add = function (y) {
    var t,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    // Signs differ?
    if (a != b) {
      y.s = -b;
      return x.minus(y);
    }

    var xe = x.e,
      xc = x.c,
      ye = y.e,
      yc = y.c;

    // Either zero? y is non-zero? x is non-zero? Or both are zero.
    if (!xc[0] || !yc[0]) return yc[0] ? y : new Big(xc[0] ? x : a * 0);

    xc = xc.slice();

    // Prepend zeros to equalise exponents.
    // Note: Faster to use reverse then do unshifts.
    if (a = xe - ye) {
      if (a > 0) {
        ye = xe;
        t = yc;
      } else {
        a = -a;
        t = xc;
      }

      t.reverse();
      for (; a--;) t.push(0);
      t.reverse();
    }

    // Point xc to the longer array.
    if (xc.length - yc.length < 0) {
      t = yc;
      yc = xc;
      xc = t;
    }

    a = yc.length;

    // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
    for (b = 0; a; xc[a] %= 10) b = (xc[--a] = xc[a] + yc[a] + b) / 10 | 0;

    // No need to check for zero, as +x + +y != 0 && -x + -y != 0

    if (b) {
      xc.unshift(b);
      ++ye;
    }

    // Remove trailing zeros.
    for (a = xc.length; xc[--a] === 0;) xc.pop();

    y.c = xc;
    y.e = ye;

    return y;
  };


  /*
   * Return a Big whose value is the value of this Big raised to the power n.
   * If n is negative, round to a maximum of Big.DP decimal places using rounding
   * mode Big.RM.
   *
   * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
   */
  P.pow = function (n) {
    var x = this,
      one = new x.constructor(1),
      y = one,
      isneg = n < 0;

    if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) throw Error(INVALID + 'exponent');
    if (isneg) n = -n;

    for (;;) {
      if (n & 1) y = y.times(x);
      n >>= 1;
      if (!n) break;
      x = x.times(x);
    }

    return isneg ? one.div(y) : y;
  };


  /*
   * Return a new Big whose value is the value of this Big rounded to a maximum of dp decimal
   * places using rounding mode rm.
   * If dp is not specified, round to 0 decimal places.
   * If rm is not specified, use Big.RM.
   *
   * dp? {number} Integer, 0 to MAX_DP inclusive.
   * rm? 0, 1, 2 or 3 (ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_UP)
   */
  P.round = function (dp, rm) {
    var Big = this.constructor;
    if (dp === UNDEFINED) dp = 0;
    else if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);
    return round(new Big(this), dp, rm === UNDEFINED ? Big.RM : rm);
  };


  /*
   * Return a new Big whose value is the square root of the value of this Big, rounded, if
   * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
  P.sqrt = function () {
    var r, c, t,
      x = this,
      Big = x.constructor,
      s = x.s,
      e = x.e,
      half = new Big(0.5);

    // Zero?
    if (!x.c[0]) return new Big(x);

    // Negative?
    if (s < 0) throw Error(NAME + 'No square root');

    // Estimate.
    s = Math.sqrt(x.toString());

    // Math.sqrt underflow/overflow?
    // Re-estimate: pass x to Math.sqrt as integer, then adjust the result exponent.
    if (s === 0 || s === 1 / 0) {
      c = x.c.join('');
      if (!(c.length + e & 1)) c += '0';
      r = new Big(Math.sqrt(c).toString());
      r.e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
    } else {
      r = new Big(s.toString());
    }

    e = r.e + (Big.DP += 4);

    // Newton-Raphson iteration.
    do {
      t = r;
      r = half.times(t.plus(x.div(t)));
    } while (t.c.slice(0, e).join('') !== r.c.slice(0, e).join(''));

    return round(r, Big.DP -= 4, Big.RM);
  };


  /*
   * Return a new Big whose value is the value of this Big times the value of Big y.
   */
  P.times = P.mul = function (y) {
    var c,
      x = this,
      Big = x.constructor,
      xc = x.c,
      yc = (y = new Big(y)).c,
      a = xc.length,
      b = yc.length,
      i = x.e,
      j = y.e;

    // Determine sign of result.
    y.s = x.s == y.s ? 1 : -1;

    // Return signed 0 if either 0.
    if (!xc[0] || !yc[0]) return new Big(y.s * 0);

    // Initialise exponent of result as x.e + y.e.
    y.e = i + j;

    // If array xc has fewer digits than yc, swap xc and yc, and lengths.
    if (a < b) {
      c = xc;
      xc = yc;
      yc = c;
      j = a;
      a = b;
      b = j;
    }

    // Initialise coefficient array of result with zeros.
    for (c = new Array(j = a + b); j--;) c[j] = 0;

    // Multiply.

    // i is initially xc.length.
    for (i = b; i--;) {
      b = 0;

      // a is yc.length.
      for (j = a + i; j > i;) {

        // Current sum of products at this digit position, plus carry.
        b = c[j] + yc[i] * xc[j - i - 1] + b;
        c[j--] = b % 10;

        // carry
        b = b / 10 | 0;
      }

      c[j] = (c[j] + b) % 10;
    }

    // Increment result exponent if there is a final carry, otherwise remove leading zero.
    if (b) ++y.e;
    else c.shift();

    // Remove trailing zeros.
    for (i = c.length; !c[--i];) c.pop();
    y.c = c;

    return y;
  };


  /*
   * Return a string representing the value of this Big in exponential notation to dp fixed decimal
   * places and rounded using Big.RM.
   *
   * dp? {number} Integer, 0 to MAX_DP inclusive.
   */
  P.toExponential = function (dp) {
    return stringify(this, 1, dp, dp);
  };


  /*
   * Return a string representing the value of this Big in normal notation to dp fixed decimal
   * places and rounded using Big.RM.
   *
   * dp? {number} Integer, 0 to MAX_DP inclusive.
   *
   * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
   * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
   */
  P.toFixed = function (dp) {
    return stringify(this, 2, dp, this.e + dp);
  };


  /*
   * Return a string representing the value of this Big rounded to sd significant digits using
   * Big.RM. Use exponential notation if sd is less than the number of digits necessary to represent
   * the integer part of the value in normal notation.
   *
   * sd {number} Integer, 1 to MAX_DP inclusive.
   */
  P.toPrecision = function (sd) {
    return stringify(this, 3, sd, sd - 1);
  };


  /*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Omit the sign for negative zero.
   */
  P.toString = function () {
    return stringify(this);
  };


  /*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Include the sign for negative zero.
   */
  P.valueOf = P.toJSON = function () {
    return stringify(this, 4);
  };


  // Export


  Big = _Big_();

  Big['default'] = Big.Big = Big;

  //AMD.
  if (typeof define === 'function' && define.amd) {
    define(function () { return Big; });

  // Node and other CommonJS-like environments that support module.exports.
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = Big;

  //Browser.
  } else {
    GLOBAL.Big = Big;
  }
})(this);
(function () {
    'use strict';

    (()=>{'use strict';if(!window.customElements)return;const a=window.HTMLElement,b=window.customElements.define,c=window.customElements.get,d=new Map,e=new Map;let f=!1,g=!1;window.HTMLElement=function(){if(!f){const a=d.get(this.constructor),b=c.call(window.customElements,a);g=!0;const e=new b;return e}f=!1;},window.HTMLElement.prototype=a.prototype;Object.defineProperty(window,'customElements',{value:window.customElements,configurable:!0,writable:!0}),Object.defineProperty(window.customElements,'define',{value:(c,h)=>{const i=h.prototype,j=class extends a{constructor(){super(),Object.setPrototypeOf(this,i),g||(f=!0,h.call(this)),g=!1;}},k=j.prototype;j.observedAttributes=h.observedAttributes,k.connectedCallback=i.connectedCallback,k.disconnectedCallback=i.disconnectedCallback,k.attributeChangedCallback=i.attributeChangedCallback,k.adoptedCallback=i.adoptedCallback,d.set(h,c),e.set(c,h),b.call(window.customElements,c,j);},configurable:!0,writable:!0}),Object.defineProperty(window.customElements,'get',{value:(a)=>e.get(a),configurable:!0,writable:!0});})();

    /**
     @license
     Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
     The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
     The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
     Code distributed by Google as part of the polymer project is also
     subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
     */

}());
(function(){
'use strict';var h=new function(){};var aa=new Set("annotation-xml color-profile font-face font-face-src font-face-uri font-face-format font-face-name missing-glyph".split(" "));function n(b){var a=aa.has(b);b=/^[a-z][.0-9_a-z]*-[\-.0-9_a-z]*$/.test(b);return!a&&b}function p(b){var a=b.isConnected;if(void 0!==a)return a;for(;b&&!(b.__CE_isImportDocument||b instanceof Document);)b=b.parentNode||(window.ShadowRoot&&b instanceof ShadowRoot?b.host:void 0);return!(!b||!(b.__CE_isImportDocument||b instanceof Document))}
function q(b,a){for(;a&&a!==b&&!a.nextSibling;)a=a.parentNode;return a&&a!==b?a.nextSibling:null}
function t(b,a,c){c=c?c:new Set;for(var d=b;d;){if(d.nodeType===Node.ELEMENT_NODE){var e=d;a(e);var f=e.localName;if("link"===f&&"import"===e.getAttribute("rel")){d=e.import;if(d instanceof Node&&!c.has(d))for(c.add(d),d=d.firstChild;d;d=d.nextSibling)t(d,a,c);d=q(b,e);continue}else if("template"===f){d=q(b,e);continue}if(e=e.__CE_shadowRoot)for(e=e.firstChild;e;e=e.nextSibling)t(e,a,c)}d=d.firstChild?d.firstChild:q(b,d)}}function u(b,a,c){b[a]=c};function v(){this.a=new Map;this.o=new Map;this.f=[];this.b=!1}function ba(b,a,c){b.a.set(a,c);b.o.set(c.constructor,c)}function w(b,a){b.b=!0;b.f.push(a)}function x(b,a){b.b&&t(a,function(a){return y(b,a)})}function y(b,a){if(b.b&&!a.__CE_patched){a.__CE_patched=!0;for(var c=0;c<b.f.length;c++)b.f[c](a)}}function z(b,a){var c=[];t(a,function(b){return c.push(b)});for(a=0;a<c.length;a++){var d=c[a];1===d.__CE_state?b.connectedCallback(d):A(b,d)}}
function B(b,a){var c=[];t(a,function(b){return c.push(b)});for(a=0;a<c.length;a++){var d=c[a];1===d.__CE_state&&b.disconnectedCallback(d)}}
function C(b,a,c){c=c?c:{};var d=c.w||new Set,e=c.s||function(a){return A(b,a)},f=[];t(a,function(a){if("link"===a.localName&&"import"===a.getAttribute("rel")){var c=a.import;c instanceof Node&&(c.__CE_isImportDocument=!0,c.__CE_hasRegistry=!0);c&&"complete"===c.readyState?c.__CE_documentLoadHandled=!0:a.addEventListener("load",function(){var c=a.import;if(!c.__CE_documentLoadHandled){c.__CE_documentLoadHandled=!0;var f=new Set(d);f.delete(c);C(b,c,{w:f,s:e})}})}else f.push(a)},d);if(b.b)for(a=0;a<
f.length;a++)y(b,f[a]);for(a=0;a<f.length;a++)e(f[a])}
function A(b,a){if(void 0===a.__CE_state){var c=a.ownerDocument;if(c.defaultView||c.__CE_isImportDocument&&c.__CE_hasRegistry)if(c=b.a.get(a.localName)){c.constructionStack.push(a);var d=c.constructor;try{try{if(new d!==a)throw Error("The custom element constructor did not produce the element being upgraded.");}finally{c.constructionStack.pop()}}catch(m){throw a.__CE_state=2,m;}a.__CE_state=1;a.__CE_definition=c;if(c.attributeChangedCallback)for(c=c.observedAttributes,d=0;d<c.length;d++){var e=c[d],
f=a.getAttribute(e);null!==f&&b.attributeChangedCallback(a,e,null,f,null)}p(a)&&b.connectedCallback(a)}}}v.prototype.connectedCallback=function(b){var a=b.__CE_definition;a.connectedCallback&&a.connectedCallback.call(b)};v.prototype.disconnectedCallback=function(b){var a=b.__CE_definition;a.disconnectedCallback&&a.disconnectedCallback.call(b)};
v.prototype.attributeChangedCallback=function(b,a,c,d,e){var f=b.__CE_definition;f.attributeChangedCallback&&-1<f.observedAttributes.indexOf(a)&&f.attributeChangedCallback.call(b,a,c,d,e)};function D(b,a){this.c=b;this.a=a;this.b=void 0;C(this.c,this.a);"loading"===this.a.readyState&&(this.b=new MutationObserver(this.f.bind(this)),this.b.observe(this.a,{childList:!0,subtree:!0}))}function E(b){b.b&&b.b.disconnect()}D.prototype.f=function(b){var a=this.a.readyState;"interactive"!==a&&"complete"!==a||E(this);for(a=0;a<b.length;a++)for(var c=b[a].addedNodes,d=0;d<c.length;d++)C(this.c,c[d])};function ca(){var b=this;this.b=this.a=void 0;this.f=new Promise(function(a){b.b=a;b.a&&a(b.a)})}function F(b){if(b.a)throw Error("Already resolved.");b.a=void 0;b.b&&b.b(void 0)};function G(b){this.i=!1;this.c=b;this.m=new Map;this.j=function(b){return b()};this.g=!1;this.l=[];this.u=new D(b,document)}
G.prototype.define=function(b,a){var c=this;if(!(a instanceof Function))throw new TypeError("Custom element constructors must be functions.");if(!n(b))throw new SyntaxError("The element name '"+b+"' is not valid.");if(this.c.a.get(b))throw Error("A custom element with name '"+b+"' has already been defined.");if(this.i)throw Error("A custom element is already being defined.");this.i=!0;var d,e,f,m,l;try{var g=function(b){var a=k[b];if(void 0!==a&&!(a instanceof Function))throw Error("The '"+b+"' callback must be a function.");
return a},k=a.prototype;if(!(k instanceof Object))throw new TypeError("The custom element constructor's prototype is not an object.");d=g("connectedCallback");e=g("disconnectedCallback");f=g("adoptedCallback");m=g("attributeChangedCallback");l=a.observedAttributes||[]}catch(r){return}finally{this.i=!1}a={localName:b,constructor:a,connectedCallback:d,disconnectedCallback:e,adoptedCallback:f,attributeChangedCallback:m,observedAttributes:l,constructionStack:[]};ba(this.c,b,a);this.l.push(a);this.g||
(this.g=!0,this.j(function(){return da(c)}))};function da(b){if(!1!==b.g){b.g=!1;for(var a=b.l,c=[],d=new Map,e=0;e<a.length;e++)d.set(a[e].localName,[]);C(b.c,document,{s:function(a){if(void 0===a.__CE_state){var e=a.localName,f=d.get(e);f?f.push(a):b.c.a.get(e)&&c.push(a)}}});for(e=0;e<c.length;e++)A(b.c,c[e]);for(;0<a.length;){for(var f=a.shift(),e=f.localName,f=d.get(f.localName),m=0;m<f.length;m++)A(b.c,f[m]);(e=b.m.get(e))&&F(e)}}}G.prototype.get=function(b){if(b=this.c.a.get(b))return b.constructor};
G.prototype.whenDefined=function(b){if(!n(b))return Promise.reject(new SyntaxError("'"+b+"' is not a valid custom element name."));var a=this.m.get(b);if(a)return a.f;a=new ca;this.m.set(b,a);this.c.a.get(b)&&!this.l.some(function(a){return a.localName===b})&&F(a);return a.f};G.prototype.v=function(b){E(this.u);var a=this.j;this.j=function(c){return b(function(){return a(c)})}};window.CustomElementRegistry=G;G.prototype.define=G.prototype.define;G.prototype.get=G.prototype.get;
G.prototype.whenDefined=G.prototype.whenDefined;G.prototype.polyfillWrapFlushCallback=G.prototype.v;var H=window.Document.prototype.createElement,ea=window.Document.prototype.createElementNS,fa=window.Document.prototype.importNode,ga=window.Document.prototype.prepend,ha=window.Document.prototype.append,ia=window.DocumentFragment.prototype.prepend,ja=window.DocumentFragment.prototype.append,I=window.Node.prototype.cloneNode,J=window.Node.prototype.appendChild,K=window.Node.prototype.insertBefore,L=window.Node.prototype.removeChild,M=window.Node.prototype.replaceChild,N=Object.getOwnPropertyDescriptor(window.Node.prototype,
"textContent"),O=window.Element.prototype.attachShadow,P=Object.getOwnPropertyDescriptor(window.Element.prototype,"innerHTML"),Q=window.Element.prototype.getAttribute,R=window.Element.prototype.setAttribute,S=window.Element.prototype.removeAttribute,T=window.Element.prototype.getAttributeNS,U=window.Element.prototype.setAttributeNS,ka=window.Element.prototype.removeAttributeNS,la=window.Element.prototype.insertAdjacentElement,ma=window.Element.prototype.prepend,na=window.Element.prototype.append,
V=window.Element.prototype.before,oa=window.Element.prototype.after,pa=window.Element.prototype.replaceWith,qa=window.Element.prototype.remove,ra=window.HTMLElement,W=Object.getOwnPropertyDescriptor(window.HTMLElement.prototype,"innerHTML"),sa=window.HTMLElement.prototype.insertAdjacentElement;function ta(){var b=X;window.HTMLElement=function(){function a(){var a=this.constructor,d=b.o.get(a);if(!d)throw Error("The custom element being constructed was not registered with `customElements`.");var e=d.constructionStack;if(!e.length)return e=H.call(document,d.localName),Object.setPrototypeOf(e,a.prototype),e.__CE_state=1,e.__CE_definition=d,y(b,e),e;var d=e.length-1,f=e[d];if(f===h)throw Error("The HTMLElement constructor was either called reentrantly for this constructor or called multiple times.");
e[d]=h;Object.setPrototypeOf(f,a.prototype);y(b,f);return f}a.prototype=ra.prototype;return a}()};function Y(b,a,c){function d(a){return function(d){for(var c=[],e=0;e<arguments.length;++e)c[e-0]=arguments[e];for(var e=[],f=[],k=0;k<c.length;k++){var r=c[k];r instanceof Element&&p(r)&&f.push(r);if(r instanceof DocumentFragment)for(r=r.firstChild;r;r=r.nextSibling)e.push(r);else e.push(r)}a.apply(this,c);for(c=0;c<f.length;c++)B(b,f[c]);if(p(this))for(c=0;c<e.length;c++)f=e[c],f instanceof Element&&z(b,f)}}c.h&&(a.prepend=d(c.h));c.append&&(a.append=d(c.append))};function ua(){var b=X;u(Document.prototype,"createElement",function(a){if(this.__CE_hasRegistry){var c=b.a.get(a);if(c)return new c.constructor}a=H.call(this,a);y(b,a);return a});u(Document.prototype,"importNode",function(a,c){a=fa.call(this,a,c);this.__CE_hasRegistry?C(b,a):x(b,a);return a});u(Document.prototype,"createElementNS",function(a,c){if(this.__CE_hasRegistry&&(null===a||"http://www.w3.org/1999/xhtml"===a)){var d=b.a.get(c);if(d)return new d.constructor}a=ea.call(this,a,c);y(b,a);return a});
Y(b,Document.prototype,{h:ga,append:ha})};function va(){var b=X;function a(a,d){Object.defineProperty(a,"textContent",{enumerable:d.enumerable,configurable:!0,get:d.get,set:function(a){if(this.nodeType===Node.TEXT_NODE)d.set.call(this,a);else{var c=void 0;if(this.firstChild){var e=this.childNodes,l=e.length;if(0<l&&p(this))for(var c=Array(l),g=0;g<l;g++)c[g]=e[g]}d.set.call(this,a);if(c)for(a=0;a<c.length;a++)B(b,c[a])}}})}u(Node.prototype,"insertBefore",function(a,d){if(a instanceof DocumentFragment){var c=Array.prototype.slice.apply(a.childNodes);
a=K.call(this,a,d);if(p(this))for(d=0;d<c.length;d++)z(b,c[d]);return a}c=p(a);d=K.call(this,a,d);c&&B(b,a);p(this)&&z(b,a);return d});u(Node.prototype,"appendChild",function(a){if(a instanceof DocumentFragment){var c=Array.prototype.slice.apply(a.childNodes);a=J.call(this,a);if(p(this))for(var e=0;e<c.length;e++)z(b,c[e]);return a}c=p(a);e=J.call(this,a);c&&B(b,a);p(this)&&z(b,a);return e});u(Node.prototype,"cloneNode",function(a){a=I.call(this,a);this.ownerDocument.__CE_hasRegistry?C(b,a):x(b,a);
return a});u(Node.prototype,"removeChild",function(a){var c=p(a),e=L.call(this,a);c&&B(b,a);return e});u(Node.prototype,"replaceChild",function(a,d){if(a instanceof DocumentFragment){var e=Array.prototype.slice.apply(a.childNodes);a=M.call(this,a,d);if(p(this))for(B(b,d),d=0;d<e.length;d++)z(b,e[d]);return a}var e=p(a),c=M.call(this,a,d),m=p(this);m&&B(b,d);e&&B(b,a);m&&z(b,a);return c});N&&N.get?a(Node.prototype,N):w(b,function(b){a(b,{enumerable:!0,configurable:!0,get:function(){for(var a=[],b=
0;b<this.childNodes.length;b++)a.push(this.childNodes[b].textContent);return a.join("")},set:function(a){for(;this.firstChild;)L.call(this,this.firstChild);J.call(this,document.createTextNode(a))}})})};function wa(b){var a=Element.prototype;function c(a){return function(c){for(var d=[],e=0;e<arguments.length;++e)d[e-0]=arguments[e];for(var e=[],l=[],g=0;g<d.length;g++){var k=d[g];k instanceof Element&&p(k)&&l.push(k);if(k instanceof DocumentFragment)for(k=k.firstChild;k;k=k.nextSibling)e.push(k);else e.push(k)}a.apply(this,d);for(d=0;d<l.length;d++)B(b,l[d]);if(p(this))for(d=0;d<e.length;d++)l=e[d],l instanceof Element&&z(b,l)}}V&&(a.before=c(V));V&&(a.after=c(oa));pa&&u(a,"replaceWith",function(a){for(var d=
[],c=0;c<arguments.length;++c)d[c-0]=arguments[c];for(var c=[],m=[],l=0;l<d.length;l++){var g=d[l];g instanceof Element&&p(g)&&m.push(g);if(g instanceof DocumentFragment)for(g=g.firstChild;g;g=g.nextSibling)c.push(g);else c.push(g)}l=p(this);pa.apply(this,d);for(d=0;d<m.length;d++)B(b,m[d]);if(l)for(B(b,this),d=0;d<c.length;d++)m=c[d],m instanceof Element&&z(b,m)});qa&&u(a,"remove",function(){var a=p(this);qa.call(this);a&&B(b,this)})};function xa(){var b=X;function a(a,c){Object.defineProperty(a,"innerHTML",{enumerable:c.enumerable,configurable:!0,get:c.get,set:function(a){var d=this,e=void 0;p(this)&&(e=[],t(this,function(a){a!==d&&e.push(a)}));c.set.call(this,a);if(e)for(var f=0;f<e.length;f++){var k=e[f];1===k.__CE_state&&b.disconnectedCallback(k)}this.ownerDocument.__CE_hasRegistry?C(b,this):x(b,this);return a}})}function c(a,c){u(a,"insertAdjacentElement",function(a,d){var e=p(d);a=c.call(this,a,d);e&&B(b,d);p(a)&&z(b,d);
return a})}O&&u(Element.prototype,"attachShadow",function(a){return this.__CE_shadowRoot=a=O.call(this,a)});P&&P.get?a(Element.prototype,P):W&&W.get?a(HTMLElement.prototype,W):w(b,function(b){a(b,{enumerable:!0,configurable:!0,get:function(){return I.call(this,!0).innerHTML},set:function(a){var b="template"===this.localName,d=b?this.content:this,c=H.call(document,this.localName);for(c.innerHTML=a;0<d.childNodes.length;)L.call(d,d.childNodes[0]);for(a=b?c.content:c;0<a.childNodes.length;)J.call(d,
a.childNodes[0])}})});u(Element.prototype,"setAttribute",function(a,c){if(1!==this.__CE_state)return R.call(this,a,c);var d=Q.call(this,a);R.call(this,a,c);c=Q.call(this,a);b.attributeChangedCallback(this,a,d,c,null)});u(Element.prototype,"setAttributeNS",function(a,c,f){if(1!==this.__CE_state)return U.call(this,a,c,f);var d=T.call(this,a,c);U.call(this,a,c,f);f=T.call(this,a,c);b.attributeChangedCallback(this,c,d,f,a)});u(Element.prototype,"removeAttribute",function(a){if(1!==this.__CE_state)return S.call(this,
a);var c=Q.call(this,a);S.call(this,a);null!==c&&b.attributeChangedCallback(this,a,c,null,null)});u(Element.prototype,"removeAttributeNS",function(a,c){if(1!==this.__CE_state)return ka.call(this,a,c);var d=T.call(this,a,c);ka.call(this,a,c);var e=T.call(this,a,c);d!==e&&b.attributeChangedCallback(this,c,d,e,a)});sa?c(HTMLElement.prototype,sa):la?c(Element.prototype,la):console.warn("Custom Elements: `Element#insertAdjacentElement` was not patched.");Y(b,Element.prototype,{h:ma,append:na});wa(b)};/*

 Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
var Z=window.customElements;if(!Z||Z.forcePolyfill||"function"!=typeof Z.define||"function"!=typeof Z.get){var X=new v;ta();ua();Y(X,DocumentFragment.prototype,{h:ia,append:ja});va();xa();document.__CE_hasRegistry=!0;var customElements=new G(X);Object.defineProperty(window,"customElements",{configurable:!0,enumerable:!0,value:customElements})};
}).call(self);

//# sourceMappingURL=custom-elements.min.js.map
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.App = f()}})(function(){var define,module,exports;return (function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

// Programmatically created by wraplib.js
if (window.Big) {
  console.log("wrapper: window.Big exists; exporting it.");
} else {
  var wrap = function wrap() {
    /*
    *  big.js v5.0.3
    *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
    *  Copyright (c) 2017 Michael Mclaughlin <M8ch88l@gmail.com>
    *  https://github.com/MikeMcl/big.js/LICENCE
    */
    ;(function (GLOBAL) {
      'use strict';

      var Big,


      /************************************** EDITABLE DEFAULTS *****************************************/

      // The default values below must be integers within the stated ranges.

      /*
       * The maximum number of decimal places (DP) of the results of operations involving division:
       * div and sqrt, and pow with negative exponents.
       */
      DP = 20,

      // 0 to MAX_DP

      /*
       * The rounding mode (RM) used when rounding to the above decimal places.
       *
       *  0  Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
       *  1  To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
       *  2  To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
       *  3  Away from zero.                                  (ROUND_UP)
       */
      RM = 1,

      // 0, 1, 2 or 3

      // The maximum value of DP and Big.DP.
      MAX_DP = 1E6,

      // 0 to 1000000

      // The maximum magnitude of the exponent argument to the pow method.
      MAX_POWER = 1E6,

      // 1 to 1000000

      /*
       * The negative exponent (NE) at and beneath which toString returns exponential notation.
       * (JavaScript numbers: -7)
       * -1000000 is the minimum recommended exponent value of a Big.
       */
      NE = -7,

      // 0 to -1000000

      /*
       * The positive exponent (PE) at and above which toString returns exponential notation.
       * (JavaScript numbers: 21)
       * 1000000 is the maximum recommended exponent value of a Big.
       * (This limit is not enforced or checked.)
       */
      PE = 21,

      // 0 to 1000000


      /**************************************************************************************************/

      // Error messages.
      NAME = '[big.js] ',
          INVALID = NAME + 'Invalid ',
          INVALID_DP = INVALID + 'decimal places',
          INVALID_RM = INVALID + 'rounding mode',
          DIV_BY_ZERO = NAME + 'Division by zero',


      // The shared prototype object.
      P = {},
          UNDEFINED = void 0,
          NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;

      /*
       * Create and return a Big constructor.
       *
       */
      function _Big_() {

        /*
         * The Big constructor and exported function.
         * Create and return a new instance of a Big number object.
         *
         * n {number|string|Big} A numeric value.
         */
        function Big(n) {
          var x = this;

          // Enable constructor usage without new.
          if (!(x instanceof Big)) return n === UNDEFINED ? _Big_() : new Big(n);

          // Duplicate.
          if (n instanceof Big) {
            x.s = n.s;
            x.e = n.e;
            x.c = n.c.slice();
          } else {
            parse(x, n);
          }

          /*
           * Retain a reference to this Big constructor, and shadow Big.prototype.constructor which
           * points to Object.
           */
          x.constructor = Big;
        }

        Big.prototype = P;
        Big.DP = DP;
        Big.RM = RM;
        Big.NE = NE;
        Big.PE = PE;
        Big.version = '5.0.2';

        return Big;
      }

      /*
       * Parse the number or string value passed to a Big constructor.
       *
       * x {Big} A Big number instance.
       * n {number|string} A numeric value.
       */
      function parse(x, n) {
        var e, i, nl;

        // Minus zero?
        if (n === 0 && 1 / n < 0) n = '-0';else if (!NUMERIC.test(n += '')) throw Error(INVALID + 'number');

        // Determine sign.
        x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

        // Decimal point?
        if ((e = n.indexOf('.')) > -1) n = n.replace('.', '');

        // Exponential form?
        if ((i = n.search(/e/i)) > 0) {

          // Determine exponent.
          if (e < 0) e = i;
          e += +n.slice(i + 1);
          n = n.substring(0, i);
        } else if (e < 0) {

          // Integer.
          e = n.length;
        }

        nl = n.length;

        // Determine leading zeros.
        for (i = 0; i < nl && n.charAt(i) == '0';) {
          ++i;
        }if (i == nl) {

          // Zero.
          x.c = [x.e = 0];
        } else {

          // Determine trailing zeros.
          for (; nl > 0 && n.charAt(--nl) == '0';) {}
          x.e = e - i - 1;
          x.c = [];

          // Convert string to array of digits without leading/trailing zeros.
          for (e = 0; i <= nl;) {
            x.c[e++] = +n.charAt(i++);
          }
        }

        return x;
      }

      /*
       * Round Big x to a maximum of dp decimal places using rounding mode rm.
       * Called by stringify, P.div, P.round and P.sqrt.
       *
       * x {Big} The Big to round.
       * dp {number} Integer, 0 to MAX_DP inclusive.
       * rm {number} 0, 1, 2 or 3 (DOWN, HALF_UP, HALF_EVEN, UP)
       * [more] {boolean} Whether the result of division was truncated.
       */
      function round(x, dp, rm, more) {
        var xc = x.c,
            i = x.e + dp + 1;

        if (i < xc.length) {
          if (rm === 1) {

            // xc[i] is the digit after the digit that may be rounded up.
            more = xc[i] >= 5;
          } else if (rm === 2) {
            more = xc[i] > 5 || xc[i] == 5 && (more || i < 0 || xc[i + 1] !== UNDEFINED || xc[i - 1] & 1);
          } else if (rm === 3) {
            more = more || xc[i] !== UNDEFINED || i < 0;
          } else {
            more = false;
            if (rm !== 0) throw Error(INVALID_RM);
          }

          if (i < 1) {
            xc.length = 1;

            if (more) {

              // 1, 0.1, 0.01, 0.001, 0.0001 etc.
              x.e = -dp;
              xc[0] = 1;
            } else {

              // Zero.
              xc[0] = x.e = 0;
            }
          } else {

            // Remove any digits after the required decimal places.
            xc.length = i--;

            // Round up?
            if (more) {

              // Rounding up may mean the previous digit has to be rounded up.
              for (; ++xc[i] > 9;) {
                xc[i] = 0;
                if (!i--) {
                  ++x.e;
                  xc.unshift(1);
                }
              }
            }

            // Remove trailing zeros.
            for (i = xc.length; !xc[--i];) {
              xc.pop();
            }
          }
        } else if (rm < 0 || rm > 3 || rm !== ~~rm) {
          throw Error(INVALID_RM);
        }

        return x;
      }

      /*
       * Return a string representing the value of Big x in normal or exponential notation.
       * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
       *
       * x {Big}
       * id? {number} Caller id.
       *         1 toExponential
       *         2 toFixed
       *         3 toPrecision
       *         4 valueOf
       * n? {number|undefined} Caller's argument.
       * k? {number|undefined}
       */
      function stringify(x, id, n, k) {
        var e,
            s,
            Big = x.constructor,
            z = !x.c[0];

        if (n !== UNDEFINED) {
          if (n !== ~~n || n < (id == 3) || n > MAX_DP) {
            throw Error(id == 3 ? INVALID + 'precision' : INVALID_DP);
          }

          x = new Big(x);

          // The index of the digit that may be rounded up.
          n = k - x.e;

          // Round?
          if (x.c.length > ++k) round(x, n, Big.RM);

          // toFixed: recalculate k as x.e may have changed if value rounded up.
          if (id == 2) k = x.e + n + 1;

          // Append zeros?
          for (; x.c.length < k;) {
            x.c.push(0);
          }
        }

        e = x.e;
        s = x.c.join('');
        n = s.length;

        // Exponential notation?
        if (id != 2 && (id == 1 || id == 3 && k <= e || e <= Big.NE || e >= Big.PE)) {
          s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

          // Normal notation.
        } else if (e < 0) {
          for (; ++e;) {
            s = '0' + s;
          }s = '0.' + s;
        } else if (e > 0) {
          if (++e > n) for (e -= n; e--;) {
            s += '0';
          } else if (e < n) s = s.slice(0, e) + '.' + s.slice(e);
        } else if (n > 1) {
          s = s.charAt(0) + '.' + s.slice(1);
        }

        return x.s < 0 && (!z || id == 4) ? '-' + s : s;
      }

      // Prototype/instance methods


      /*
       * Return a new Big whose value is the absolute value of this Big.
       */
      P.abs = function () {
        var x = new this.constructor(this);
        x.s = 1;
        return x;
      };

      /*
       * Return 1 if the value of this Big is greater than the value of Big y,
       *       -1 if the value of this Big is less than the value of Big y, or
       *        0 if they have the same value.
      */
      P.cmp = function (y) {
        var isneg,
            x = this,
            xc = x.c,
            yc = (y = new x.constructor(y)).c,
            i = x.s,
            j = y.s,
            k = x.e,
            l = y.e;

        // Either zero?
        if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;

        // Signs differ?
        if (i != j) return i;

        isneg = i < 0;

        // Compare exponents.
        if (k != l) return k > l ^ isneg ? 1 : -1;

        j = (k = xc.length) < (l = yc.length) ? k : l;

        // Compare digit by digit.
        for (i = -1; ++i < j;) {
          if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
        }

        // Compare lengths.
        return k == l ? 0 : k > l ^ isneg ? 1 : -1;
      };

      /*
       * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
       * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
       */
      P.div = function (y) {
        var x = this,
            Big = x.constructor,
            a = x.c,

        // dividend
        b = (y = new Big(y)).c,

        // divisor
        k = x.s == y.s ? 1 : -1,
            dp = Big.DP;

        if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);

        // Divisor is zero?
        if (!b[0]) throw Error(DIV_BY_ZERO);

        // Dividend is 0? Return +-0.
        if (!a[0]) return new Big(k * 0);

        var bl,
            bt,
            n,
            cmp,
            ri,
            bz = b.slice(),
            ai = bl = b.length,
            al = a.length,
            r = a.slice(0, bl),

        // remainder
        rl = r.length,
            q = y,

        // quotient
        qc = q.c = [],
            qi = 0,
            d = dp + (q.e = x.e - y.e) + 1; // number of digits of the result

        q.s = k;
        k = d < 0 ? 0 : d;

        // Create version of divisor with leading zero.
        bz.unshift(0);

        // Add zeros to make remainder as long as divisor.
        for (; rl++ < bl;) {
          r.push(0);
        }do {

          // n is how many times the divisor goes into current remainder.
          for (n = 0; n < 10; n++) {

            // Compare divisor and remainder.
            if (bl != (rl = r.length)) {
              cmp = bl > rl ? 1 : -1;
            } else {
              for (ri = -1, cmp = 0; ++ri < bl;) {
                if (b[ri] != r[ri]) {
                  cmp = b[ri] > r[ri] ? 1 : -1;
                  break;
                }
              }
            }

            // If divisor < remainder, subtract divisor from remainder.
            if (cmp < 0) {

              // Remainder can't be more than 1 digit longer than divisor.
              // Equalise lengths using divisor with extra leading zero?
              for (bt = rl == bl ? b : bz; rl;) {
                if (r[--rl] < bt[rl]) {
                  ri = rl;
                  for (; ri && !r[--ri];) {
                    r[ri] = 9;
                  }--r[ri];
                  r[rl] += 10;
                }
                r[rl] -= bt[rl];
              }

              for (; !r[0];) {
                r.shift();
              }
            } else {
              break;
            }
          }

          // Add the digit n to the result array.
          qc[qi++] = cmp ? n : ++n;

          // Update the remainder.
          if (r[0] && cmp) r[rl] = a[ai] || 0;else r = [a[ai]];
        } while ((ai++ < al || r[0] !== UNDEFINED) && k--);

        // Leading zero? Do not remove if result is simply zero (qi == 1).
        if (!qc[0] && qi != 1) {

          // There can't be more than one zero.
          qc.shift();
          q.e--;
        }

        // Round?
        if (qi > d) round(q, dp, Big.RM, r[0] !== UNDEFINED);

        return q;
      };

      /*
       * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
       */
      P.eq = function (y) {
        return !this.cmp(y);
      };

      /*
       * Return true if the value of this Big is greater than the value of Big y, otherwise return
       * false.
       */
      P.gt = function (y) {
        return this.cmp(y) > 0;
      };

      /*
       * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
       * return false.
       */
      P.gte = function (y) {
        return this.cmp(y) > -1;
      };

      /*
       * Return true if the value of this Big is less than the value of Big y, otherwise return false.
       */
      P.lt = function (y) {
        return this.cmp(y) < 0;
      };

      /*
       * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
       * return false.
       */
      P.lte = function (y) {
        return this.cmp(y) < 1;
      };

      /*
       * Return a new Big whose value is the value of this Big minus the value of Big y.
       */
      P.minus = P.sub = function (y) {
        var i,
            j,
            t,
            xlty,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        // Signs differ?
        if (a != b) {
          y.s = -b;
          return x.plus(y);
        }

        var xc = x.c.slice(),
            xe = x.e,
            yc = y.c,
            ye = y.e;

        // Either zero?
        if (!xc[0] || !yc[0]) {

          // y is non-zero? x is non-zero? Or both are zero.
          return yc[0] ? (y.s = -b, y) : new Big(xc[0] ? x : 0);
        }

        // Determine which is the bigger number. Prepend zeros to equalise exponents.
        if (a = xe - ye) {

          if (xlty = a < 0) {
            a = -a;
            t = xc;
          } else {
            ye = xe;
            t = yc;
          }

          t.reverse();
          for (b = a; b--;) {
            t.push(0);
          }t.reverse();
        } else {

          // Exponents equal. Check digit by digit.
          j = ((xlty = xc.length < yc.length) ? xc : yc).length;

          for (a = b = 0; b < j; b++) {
            if (xc[b] != yc[b]) {
              xlty = xc[b] < yc[b];
              break;
            }
          }
        }

        // x < y? Point xc to the array of the bigger number.
        if (xlty) {
          t = xc;
          xc = yc;
          yc = t;
          y.s = -y.s;
        }

        /*
         * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
         * needs to start at yc.length.
         */
        if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) {
          xc[i++] = 0;
        } // Subtract yc from xc.
        for (b = i; j > a;) {
          if (xc[--j] < yc[j]) {
            for (i = j; i && !xc[--i];) {
              xc[i] = 9;
            }--xc[i];
            xc[j] += 10;
          }

          xc[j] -= yc[j];
        }

        // Remove trailing zeros.
        for (; xc[--b] === 0;) {
          xc.pop();
        } // Remove leading zeros and adjust exponent accordingly.
        for (; xc[0] === 0;) {
          xc.shift();
          --ye;
        }

        if (!xc[0]) {

          // n - n = +0
          y.s = 1;

          // Result must be zero.
          xc = [ye = 0];
        }

        y.c = xc;
        y.e = ye;

        return y;
      };

      /*
       * Return a new Big whose value is the value of this Big modulo the value of Big y.
       */
      P.mod = function (y) {
        var ygtx,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        if (!y.c[0]) throw Error(DIV_BY_ZERO);

        x.s = y.s = 1;
        ygtx = y.cmp(x) == 1;
        x.s = a;
        y.s = b;

        if (ygtx) return new Big(x);

        a = Big.DP;
        b = Big.RM;
        Big.DP = Big.RM = 0;
        x = x.div(y);
        Big.DP = a;
        Big.RM = b;

        return this.minus(x.times(y));
      };

      /*
       * Return a new Big whose value is the value of this Big plus the value of Big y.
       */
      P.plus = P.add = function (y) {
        var t,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        // Signs differ?
        if (a != b) {
          y.s = -b;
          return x.minus(y);
        }

        var xe = x.e,
            xc = x.c,
            ye = y.e,
            yc = y.c;

        // Either zero? y is non-zero? x is non-zero? Or both are zero.
        if (!xc[0] || !yc[0]) return yc[0] ? y : new Big(xc[0] ? x : a * 0);

        xc = xc.slice();

        // Prepend zeros to equalise exponents.
        // Note: Faster to use reverse then do unshifts.
        if (a = xe - ye) {
          if (a > 0) {
            ye = xe;
            t = yc;
          } else {
            a = -a;
            t = xc;
          }

          t.reverse();
          for (; a--;) {
            t.push(0);
          }t.reverse();
        }

        // Point xc to the longer array.
        if (xc.length - yc.length < 0) {
          t = yc;
          yc = xc;
          xc = t;
        }

        a = yc.length;

        // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
        for (b = 0; a; xc[a] %= 10) {
          b = (xc[--a] = xc[a] + yc[a] + b) / 10 | 0;
        } // No need to check for zero, as +x + +y != 0 && -x + -y != 0

        if (b) {
          xc.unshift(b);
          ++ye;
        }

        // Remove trailing zeros.
        for (a = xc.length; xc[--a] === 0;) {
          xc.pop();
        }y.c = xc;
        y.e = ye;

        return y;
      };

      /*
       * Return a Big whose value is the value of this Big raised to the power n.
       * If n is negative, round to a maximum of Big.DP decimal places using rounding
       * mode Big.RM.
       *
       * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
       */
      P.pow = function (n) {
        var x = this,
            one = new x.constructor(1),
            y = one,
            isneg = n < 0;

        if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) throw Error(INVALID + 'exponent');
        if (isneg) n = -n;

        for (;;) {
          if (n & 1) y = y.times(x);
          n >>= 1;
          if (!n) break;
          x = x.times(x);
        }

        return isneg ? one.div(y) : y;
      };

      /*
       * Return a new Big whose value is the value of this Big rounded to a maximum of dp decimal
       * places using rounding mode rm.
       * If dp is not specified, round to 0 decimal places.
       * If rm is not specified, use Big.RM.
       *
       * dp? {number} Integer, 0 to MAX_DP inclusive.
       * rm? 0, 1, 2 or 3 (ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_UP)
       */
      P.round = function (dp, rm) {
        var Big = this.constructor;
        if (dp === UNDEFINED) dp = 0;else if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);
        return round(new Big(this), dp, rm === UNDEFINED ? Big.RM : rm);
      };

      /*
       * Return a new Big whose value is the square root of the value of this Big, rounded, if
       * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
       */
      P.sqrt = function () {
        var r,
            c,
            t,
            x = this,
            Big = x.constructor,
            s = x.s,
            e = x.e,
            half = new Big(0.5);

        // Zero?
        if (!x.c[0]) return new Big(x);

        // Negative?
        if (s < 0) throw Error(NAME + 'No square root');

        // Estimate.
        s = Math.sqrt(x.toString());

        // Math.sqrt underflow/overflow?
        // Re-estimate: pass x to Math.sqrt as integer, then adjust the result exponent.
        if (s === 0 || s === 1 / 0) {
          c = x.c.join('');
          if (!(c.length + e & 1)) c += '0';
          r = new Big(Math.sqrt(c).toString());
          r.e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
        } else {
          r = new Big(s.toString());
        }

        e = r.e + (Big.DP += 4);

        // Newton-Raphson iteration.
        do {
          t = r;
          r = half.times(t.plus(x.div(t)));
        } while (t.c.slice(0, e).join('') !== r.c.slice(0, e).join(''));

        return round(r, Big.DP -= 4, Big.RM);
      };

      /*
       * Return a new Big whose value is the value of this Big times the value of Big y.
       */
      P.times = P.mul = function (y) {
        var c,
            x = this,
            Big = x.constructor,
            xc = x.c,
            yc = (y = new Big(y)).c,
            a = xc.length,
            b = yc.length,
            i = x.e,
            j = y.e;

        // Determine sign of result.
        y.s = x.s == y.s ? 1 : -1;

        // Return signed 0 if either 0.
        if (!xc[0] || !yc[0]) return new Big(y.s * 0);

        // Initialise exponent of result as x.e + y.e.
        y.e = i + j;

        // If array xc has fewer digits than yc, swap xc and yc, and lengths.
        if (a < b) {
          c = xc;
          xc = yc;
          yc = c;
          j = a;
          a = b;
          b = j;
        }

        // Initialise coefficient array of result with zeros.
        for (c = new Array(j = a + b); j--;) {
          c[j] = 0;
        } // Multiply.

        // i is initially xc.length.
        for (i = b; i--;) {
          b = 0;

          // a is yc.length.
          for (j = a + i; j > i;) {

            // Current sum of products at this digit position, plus carry.
            b = c[j] + yc[i] * xc[j - i - 1] + b;
            c[j--] = b % 10;

            // carry
            b = b / 10 | 0;
          }

          c[j] = (c[j] + b) % 10;
        }

        // Increment result exponent if there is a final carry, otherwise remove leading zero.
        if (b) ++y.e;else c.shift();

        // Remove trailing zeros.
        for (i = c.length; !c[--i];) {
          c.pop();
        }y.c = c;

        return y;
      };

      /*
       * Return a string representing the value of this Big in exponential notation to dp fixed decimal
       * places and rounded using Big.RM.
       *
       * dp? {number} Integer, 0 to MAX_DP inclusive.
       */
      P.toExponential = function (dp) {
        return stringify(this, 1, dp, dp);
      };

      /*
       * Return a string representing the value of this Big in normal notation to dp fixed decimal
       * places and rounded using Big.RM.
       *
       * dp? {number} Integer, 0 to MAX_DP inclusive.
       *
       * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
       * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
       */
      P.toFixed = function (dp) {
        return stringify(this, 2, dp, this.e + dp);
      };

      /*
       * Return a string representing the value of this Big rounded to sd significant digits using
       * Big.RM. Use exponential notation if sd is less than the number of digits necessary to represent
       * the integer part of the value in normal notation.
       *
       * sd {number} Integer, 1 to MAX_DP inclusive.
       */
      P.toPrecision = function (sd) {
        return stringify(this, 3, sd, sd - 1);
      };

      /*
       * Return a string representing the value of this Big.
       * Return exponential notation if this Big has a positive exponent equal to or greater than
       * Big.PE, or a negative exponent equal to or less than Big.NE.
       * Omit the sign for negative zero.
       */
      P.toString = function () {
        return stringify(this);
      };

      /*
       * Return a string representing the value of this Big.
       * Return exponential notation if this Big has a positive exponent equal to or greater than
       * Big.PE, or a negative exponent equal to or less than Big.NE.
       * Include the sign for negative zero.
       */
      P.valueOf = P.toJSON = function () {
        return stringify(this, 4);
      };

      // Export


      Big = _Big_();

      Big['default'] = Big.Big = Big;

      //AMD.
      if (typeof define === 'function' && define.amd) {
        define(function () {
          return Big;
        });

        // Node and other CommonJS-like environments that support module.exports.
      } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = Big;

        //Browser.
      } else {
        GLOBAL.Big = Big;
      }
    })(this);
  };

  wrap.call(window);
}
var result = window.Big;
if (!result) throw Error("wrapper failed, file: node_modules/big.js/big.js name: Big");
console.log('wraplib node_modules/big.js/big.js Big', _typeof(window.Big));
exports.default = result;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = calculate;

var _operate = require('./operate.js');

var _operate2 = _interopRequireDefault(_operate);

var _isNumber = require('./isNumber.js');

var _isNumber2 = _interopRequireDefault(_isNumber);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Given a button name and a calculator data object, return an updated
 * calculator data object.
 *
 * Calculator data object contains:
 *   total:s      the running total
 *   next:String       the next number to be operated on with the total
 *   operation:String  +, -, etc.
 */
function calculate(obj, buttonName) {
  if (buttonName === 'AC') {
    return {
      total: null,
      next: null,
      operation: null
    };
  }

  if ((0, _isNumber2.default)(buttonName)) {
    if (buttonName === '0' && obj.next === '0') {
      return {};
    }
    // If there is an operation, update next
    if (obj.operation) {
      if (obj.next) {
        return { next: obj.next + buttonName };
      }
      return { next: buttonName };
    }
    // If there is no operation, update next and clear the value
    if (obj.next) {
      return {
        next: obj.next + buttonName,
        total: null
      };
    }
    return {
      next: buttonName,
      total: null
    };
  }

  if (buttonName === '.') {
    if (obj.next) {
      if (obj.next.includes('.')) {
        return {};
      }
      return { next: obj.next + '.' };
    }
    if (obj.operation) {
      return { next: '0.' };
    }
    if (obj.total) {
      if (obj.total.includes('.')) {
        return {};
      }
      return { total: obj.total + '.' };
    }
    return { total: '0.' };
  }

  if (buttonName === '=') {
    if (obj.next && obj.operation) {
      return {
        total: (0, _operate2.default)(obj.total, obj.next, obj.operation),
        next: null,
        operation: null
      };
    } else {
      // '=' with no operation, nothing to do
      return {};
    }
  }

  if (buttonName === '+/-') {
    if (obj.next) {
      return { next: (-1 * parseFloat(obj.next)).toString() };
    }
    if (obj.total) {
      return { total: (-1 * parseFloat(obj.total)).toString() };
    }
    return {};
  }

  // Button must be an operation

  // When the user presses an operation button without having entered
  // a number first, do nothing.
  // if (!obj.next && !obj.total) {
  //   return {};
  // }

  // User pressed an operation button and there is an existing operation
  if (obj.operation) {
    return {
      total: (0, _operate2.default)(obj.total, obj.next, obj.operation),
      next: null,
      operation: buttonName
    };
  }

  // no operation yet, but the user typed one

  // The user hasn't typed a number yet, just save the operation
  if (!obj.next) {
    return { operation: buttonName };
  }

  // save the operation and shift 'next' into 'total'
  return {
    total: obj.next,
    next: null,
    operation: buttonName
  };
}

},{"./isNumber.js":3,"./operate.js":4}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isNumber;
function isNumber(item) {
  return !!item.match(/[0-9]+/);
}

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = operate;

var _big = require('../libs/big.js');

var _big2 = _interopRequireDefault(_big);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function operate(numberOne, numberTwo, operation) {
  var one = (0, _big2.default)(numberOne);
  var two = (0, _big2.default)(numberTwo);
  if (operation === '+') {
    return one.plus(two).toString();
  }
  if (operation === '-') {
    return one.minus(two).toString();
  }
  if (operation === 'x') {
    return one.times(two).toString();
  }
  if (operation === '÷') {
    return one.div(two).toString();
  }
  if (operation === '%') {
    return one.mod(two).toString();
  }
  throw Error('Unknown operation \'' + operation + '\'');
}

},{"../libs/big.js":1}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    get: function get(params) {
        return "\n            <style>\n                calc-app {\n                display: flex;\n                flex-direction: column;;\n                flex-wrap: wrap;\n                height: 100%;\n            }\n            </style>";
    }
};

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _calcdisplay = require('../calcdisplay/calcdisplay.js');

var _calcdisplay2 = _interopRequireDefault(_calcdisplay);

var _calcbuttonpanel = require('../calcbuttonpanel/calcbuttonpanel.js');

var _calcbuttonpanel2 = _interopRequireDefault(_calcbuttonpanel);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = {
    get: function get(params) {
        return '<calc-display></calc-display>\n                <calc-buttonpanel></calc-buttonpanel>';
    }
};

},{"../calcbuttonpanel/calcbuttonpanel.js":13,"../calcdisplay/calcdisplay.js":16}],7:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _calcbutton = require('../calcbutton/calcbutton.js');

var _calcbutton2 = _interopRequireDefault(_calcbutton);

var _calculate = require('../../logic/calculate.js');

var _calculate2 = _interopRequireDefault(_calculate);

var _calcappHtml = require('./calcapp.html.js');

var _calcappHtml2 = _interopRequireDefault(_calcappHtml);

var _calcappCss = require('./calcapp.css.js');

var _calcappCss2 = _interopRequireDefault(_calcappCss);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var CalcApp = function (_HTMLElement) {
    _inherits(CalcApp, _HTMLElement);

    function CalcApp() {
        _classCallCheck(this, CalcApp);

        var _this = _possibleConstructorReturn(this, (CalcApp.__proto__ || Object.getPrototypeOf(CalcApp)).call(this));

        _this.state = {
            total: null,
            next: null,
            operation: null
        };
        return _this;
    }

    _createClass(CalcApp, [{
        key: 'connectedCallback',
        value: function connectedCallback() {
            var _this2 = this;

            this.innerHTML = _calcappHtml2.default.get() + ' ' + _calcappCss2.default.get();

            this.dom = {
                buttonpanel: this.querySelector('calc-buttonpanel'),
                display: this.querySelector('calc-display')
            };

            this.dom.buttonpanel.addEventListener(_calcbutton2.default.CALC_BUTTON_PRESS, function (e) {
                return _this2.onButtonPress(e);
            });
        }
    }, {
        key: 'onButtonPress',
        value: function onButtonPress(event) {
            // React's setState overlaid return values over the original - a simple for loop can do the same
            var calc = (0, _calculate2.default)(this.state, event.detail.name);
            for (var c in calc) {
                this.state[c] = calc[c];
            }
            this.dom.display.value = this.state.next || this.state.total || '0';
        }
    }]);

    return CalcApp;
}(HTMLElement);

exports.default = CalcApp;

if (!customElements.get('calc-app')) {
    customElements.define('calc-app', CalcApp);
}

},{"../../logic/calculate.js":2,"../calcbutton/calcbutton.js":10,"./calcapp.css.js":5,"./calcapp.html.js":6}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  get: function get(params) {
    return "<style>\n                    calc-button {\n                      display: inline-flex;\n                      width: 25%;\n                      flex: 1 0 auto;\n                    }\n                    \n                    calc-button.wide {\n                      width: 50%;\n                    }\n                    \n                    calc-button button {\n                      background-color: #E0E0E0;\n                      border: 0;\n                      font-size: 12px;\n                      margin: 0 1px 0 0;\n                      flex: 1 0 auto;\n                      padding: 0;\n                    }\n                    \n                    calc-button:last-child button {\n                      margin-right: 0;\n                    }\n                    \n                    calc-button.orange button {\n                      background-color: #F5923E;\n                      color: white;\n                    }\n                    \n                    @media (min-width: 200px) and (min-height: 200px) {\n                      calc-button button {\n                        font-size: 25px;\n                      }\n                    }\n                    \n                    @media (min-width: 300px) and (min-height: 300px) {\n                      calc-button button {\n                        font-size: 30px;\n                      }\n                    }\n                    \n                    @media (min-width: 400px) and (min-height: 400px) {\n                      calc-button button {\n                        font-size: 35px;\n                      }\n                    }\n                    \n                    @media (min-width: 500px) and (min-height: 500px) {\n                      calc-button button {\n                        font-size: 40px;\n                      }\n                    }\n                    \n                    @media (min-width: 600px) and (min-height: 600px) {\n                      calc-button button {\n                        font-size: 60px;\n                      }\n                    }\n                    \n                    @media (min-width: 800px) and (min-height: 800px) {\n                      calc-button button {\n                        font-size: 70px;\n                      }\n                    }\n                </style>";
  }
};

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    get: function get(params) {
        return "<button>" + params.name + "</button>";
    }
};

},{}],10:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _calcbuttonHtml = require('./calcbutton.html.js');

var _calcbuttonHtml2 = _interopRequireDefault(_calcbuttonHtml);

var _calcbuttonCss = require('./calcbutton.css.js');

var _calcbuttonCss2 = _interopRequireDefault(_calcbuttonCss);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var CalcButton = function (_HTMLElement) {
    _inherits(CalcButton, _HTMLElement);

    function CalcButton() {
        _classCallCheck(this, CalcButton);

        return _possibleConstructorReturn(this, (CalcButton.__proto__ || Object.getPrototypeOf(CalcButton)).apply(this, arguments));
    }

    _createClass(CalcButton, [{
        key: 'connectedCallback',
        value: function connectedCallback() {
            var _this2 = this;

            this.innerHTML = '  ' + _calcbuttonHtml2.default.get({ name: this.getAttribute('name') }) + ' \n                            ' + _calcbuttonCss2.default.get();
            this.querySelector('button').addEventListener('click', function (e) {
                return _this2.onButtonClick(e);
            });
        }
    }, {
        key: 'onButtonClick',
        value: function onButtonClick(e) {
            var ce = new CustomEvent(CalcButton.CALC_BUTTON_PRESS, { bubbles: true,
                cancelable: false,
                detail: { name: this.getAttribute('name') } });
            this.dispatchEvent(ce);
        }
    }], [{
        key: 'CALC_BUTTON_PRESS',
        get: function get() {
            return 'onCalcButtonPress';
        }
    }]);

    return CalcButton;
}(HTMLElement);

exports.default = CalcButton;

if (!customElements.get('calc-button')) {
    customElements.define('calc-button', CalcButton);
}

},{"./calcbutton.css.js":8,"./calcbutton.html.js":9}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    get: function get(params) {
        return "\n                <style>\n                    calc-buttonpanel {\n                      background-color: #858694;\n                      display: flex;\n                      flex-direction: row;\n                      flex-wrap: wrap;\n                      flex: 1 0 auto;\n                    }\n                    \n                    calc-buttonpanel > div {\n                      width: 100%;\n                      margin-bottom: 1px;\n                      flex: 1 0 auto;\n                      display: flex;\n                    }\n                </style>";
    }
};

},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _calcbutton = require('../calcbutton/calcbutton.js');

var _calcbutton2 = _interopRequireDefault(_calcbutton);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = {
  get: function get(params) {
    return '<div>\n                  <calc-button name="AC"></calc-button>\n                  <calc-button name="+/-"></calc-button>\n                  <calc-button name="%"></calc-button>\n                  <calc-button name="\xF7" class="orange"></calc-button>\n                </div>\n                <div>\n                  <calc-button name="7"></calc-button>\n                  <calc-button name="8"></calc-button>\n                  <calc-button name="9"></calc-button>\n                  <calc-button name="x" class="orange"></calc-button>\n                </div>\n                <div>\n                  <calc-button name="4"></calc-button>\n                  <calc-button name="5"></calc-button>\n                  <calc-button name="6"></calc-button>\n                  <calc-button name="-" class="orange"></calc-button>\n                </div>\n                <div>\n                  <calc-button name="1"></calc-button>\n                  <calc-button name="2"></calc-button>\n                  <calc-button name="3"></calc-button>\n                  <calc-button name="+" class="orange"></calc-button>\n                </div>\n                <div>\n                  <calc-button name="0" class="wide"></calc-button>\n                  <calc-button name="."></calc-button>\n                  <calc-button name="=" class="orange"></calc-button>\n                </div>';
  }
};

},{"../calcbutton/calcbutton.js":10}],13:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _calcbuttonpanelHtml = require('./calcbuttonpanel.html.js');

var _calcbuttonpanelHtml2 = _interopRequireDefault(_calcbuttonpanelHtml);

var _calcbuttonpanelCss = require('./calcbuttonpanel.css.js');

var _calcbuttonpanelCss2 = _interopRequireDefault(_calcbuttonpanelCss);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var CalcButtonPanel = function (_HTMLElement) {
    _inherits(CalcButtonPanel, _HTMLElement);

    function CalcButtonPanel() {
        _classCallCheck(this, CalcButtonPanel);

        return _possibleConstructorReturn(this, (CalcButtonPanel.__proto__ || Object.getPrototypeOf(CalcButtonPanel)).apply(this, arguments));
    }

    _createClass(CalcButtonPanel, [{
        key: 'connectedCallback',
        value: function connectedCallback() {
            this.innerHTML = _calcbuttonpanelHtml2.default.get() + ' ' + _calcbuttonpanelCss2.default.get();
        }
    }]);

    return CalcButtonPanel;
}(HTMLElement);

exports.default = CalcButtonPanel;

if (!customElements.get('calc-buttonpanel')) {
    customElements.define('calc-buttonpanel', CalcButtonPanel);
}

},{"./calcbuttonpanel.css.js":11,"./calcbuttonpanel.html.js":12}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  get: function get(params) {
    return "<style>\n                    calc-display {\n                      background-color: #858694;\n                      color: white;\n                      text-align: right;\n                      font-weight: 200;\n                      flex: 0 0 auto;\n                      width: 100%;\n                    }\n                    \n                    calc-display > div {\n                      font-size: 20px;\n                      padding: 8px 4px 0 4px;\n                    }\n                    \n                    @media (min-width: 200px) and (min-height: 200px) {\n                      calc-display > div {\n                        font-size: 60px;\n                        padding: 20px 16px 0 10px;\n                      }\n                    }\n                    \n                    @media (min-width: 300px) and (min-height: 200px) {\n                      calc-display > div {\n                        font-size: 70px;\n                        padding: 20px 22px 0 10px;\n                      }\n                    }\n                    \n                    @media (min-width: 600px) and (min-height: 600px) {\n                      calc-display > div {\n                        font-size: 80px;\n                        padding: 20px 30px 0 15px;\n                      }\n                    }\n                    \n                    @media (min-width: 800px) and (min-height: 800px) {\n                      calc-display > div {\n                        font-size: 100px;\n                        padding: 20px 40px 0 20px;\n                      }\n                    }\n                </style>";
  }
};

},{}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    get: function get(params) {
        return "<div class=\"display-text\">0</div>";
    }
};

},{}],16:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _calcdisplayHtml = require('./calcdisplay.html.js');

var _calcdisplayHtml2 = _interopRequireDefault(_calcdisplayHtml);

var _calcdisplayCss = require('./calcdisplay.css.js');

var _calcdisplayCss2 = _interopRequireDefault(_calcdisplayCss);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var CalcDisplay = function (_HTMLElement) {
    _inherits(CalcDisplay, _HTMLElement);

    function CalcDisplay() {
        _classCallCheck(this, CalcDisplay);

        return _possibleConstructorReturn(this, (CalcDisplay.__proto__ || Object.getPrototypeOf(CalcDisplay)).apply(this, arguments));
    }

    _createClass(CalcDisplay, [{
        key: 'connectedCallback',
        value: function connectedCallback() {
            this.innerHTML = _calcdisplayHtml2.default.get() + ' ' + _calcdisplayCss2.default.get();
            this.dom = {
                displayText: this.querySelector('.display-text')
            };
        }
    }, {
        key: 'value',
        set: function set(val) {
            this.dom.displayText.innerText = val;
        }
    }]);

    return CalcDisplay;
}(HTMLElement);

exports.default = CalcDisplay;

if (!customElements.get('calc-display')) {
    customElements.define('calc-display', CalcDisplay);
}

},{"./calcdisplay.css.js":14,"./calcdisplay.html.js":15}]},{},[7])(7)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbGlicy9iaWcuanMiLCJzcmMvbG9naWMvY2FsY3VsYXRlLmpzIiwic3JjL2xvZ2ljL2lzTnVtYmVyLmpzIiwic3JjL2xvZ2ljL29wZXJhdGUuanMiLCJzcmMvd2ViY29tcG9uZW50cy9jYWxjYXBwL2NhbGNhcHAuY3NzLmpzIiwic3JjL3dlYmNvbXBvbmVudHMvY2FsY2FwcC9jYWxjYXBwLmh0bWwuanMiLCJzcmMvd2ViY29tcG9uZW50cy9jYWxjYXBwL2NhbGNhcHAuanMiLCJzcmMvd2ViY29tcG9uZW50cy9jYWxjYnV0dG9uL2NhbGNidXR0b24uY3NzLmpzIiwic3JjL3dlYmNvbXBvbmVudHMvY2FsY2J1dHRvbi9jYWxjYnV0dG9uLmh0bWwuanMiLCJzcmMvd2ViY29tcG9uZW50cy9jYWxjYnV0dG9uL2NhbGNidXR0b24uanMiLCJzcmMvd2ViY29tcG9uZW50cy9jYWxjYnV0dG9ucGFuZWwvY2FsY2J1dHRvbnBhbmVsLmNzcy5qcyIsInNyYy93ZWJjb21wb25lbnRzL2NhbGNidXR0b25wYW5lbC9jYWxjYnV0dG9ucGFuZWwuaHRtbC5qcyIsInNyYy93ZWJjb21wb25lbnRzL2NhbGNidXR0b25wYW5lbC9jYWxjYnV0dG9ucGFuZWwuanMiLCJzcmMvd2ViY29tcG9uZW50cy9jYWxjZGlzcGxheS9jYWxjZGlzcGxheS5jc3MuanMiLCJzcmMvd2ViY29tcG9uZW50cy9jYWxjZGlzcGxheS9jYWxjZGlzcGxheS5odG1sLmpzIiwic3JjL3dlYmNvbXBvbmVudHMvY2FsY2Rpc3BsYXkvY2FsY2Rpc3BsYXkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7OztBQ0FBO0FBQ0EsSUFBSSxPQUFKLEFBQVcsS0FBSyxBQUNkO1VBQUEsQUFBUSxJQUFSLEFBQVksQUFDYjtBQUZELE9BRU87TUFBQSxBQUNJLE9BQVQsU0FBQSxBQUFTLE9BQVEsQUFDZjtBQU1K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OztFLEFBSG9DOztrQixBQUFwQjs7QUFhckIsSUFBSSxDQUFDLGVBQUEsQUFBZSxJQUFwQixBQUFLLEFBQW1CLGlCQUFpQixBQUNyQzttQkFBQSxBQUFlLE9BQWYsQUFBc0IsZ0JBQXRCLEFBQXNDLEFBQ3pDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc31yZXR1cm4gZX0pKCkiLCIvLyBQcm9ncmFtbWF0aWNhbGx5IGNyZWF0ZWQgYnkgd3JhcGxpYi5qc1xuaWYgKHdpbmRvdy5CaWcpIHtcbiAgY29uc29sZS5sb2coXCJ3cmFwcGVyOiB3aW5kb3cuQmlnIGV4aXN0czsgZXhwb3J0aW5nIGl0LlwiKVxufSBlbHNlIHtcbiAgZnVuY3Rpb24gd3JhcCAoKSB7XG4gICAgLypcclxuICogIGJpZy5qcyB2NS4wLjNcclxuICogIEEgc21hbGwsIGZhc3QsIGVhc3ktdG8tdXNlIGxpYnJhcnkgZm9yIGFyYml0cmFyeS1wcmVjaXNpb24gZGVjaW1hbCBhcml0aG1ldGljLlxyXG4gKiAgQ29weXJpZ2h0IChjKSAyMDE3IE1pY2hhZWwgTWNsYXVnaGxpbiA8TThjaDg4bEBnbWFpbC5jb20+XHJcbiAqICBodHRwczovL2dpdGh1Yi5jb20vTWlrZU1jbC9iaWcuanMvTElDRU5DRVxyXG4gKi9cclxuOyhmdW5jdGlvbiAoR0xPQkFMKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIHZhciBCaWcsXHJcblxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIEVESVRBQkxFIERFRkFVTFRTICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuXHJcbiAgICAvLyBUaGUgZGVmYXVsdCB2YWx1ZXMgYmVsb3cgbXVzdCBiZSBpbnRlZ2VycyB3aXRoaW4gdGhlIHN0YXRlZCByYW5nZXMuXHJcblxyXG4gICAgLypcclxuICAgICAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBkZWNpbWFsIHBsYWNlcyAoRFApIG9mIHRoZSByZXN1bHRzIG9mIG9wZXJhdGlvbnMgaW52b2x2aW5nIGRpdmlzaW9uOlxyXG4gICAgICogZGl2IGFuZCBzcXJ0LCBhbmQgcG93IHdpdGggbmVnYXRpdmUgZXhwb25lbnRzLlxyXG4gICAgICovXHJcbiAgICBEUCA9IDIwLCAgICAgICAgICAvLyAwIHRvIE1BWF9EUFxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBUaGUgcm91bmRpbmcgbW9kZSAoUk0pIHVzZWQgd2hlbiByb3VuZGluZyB0byB0aGUgYWJvdmUgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgKlxyXG4gICAgICogIDAgIFRvd2FyZHMgemVybyAoaS5lLiB0cnVuY2F0ZSwgbm8gcm91bmRpbmcpLiAgICAgICAoUk9VTkRfRE9XTilcclxuICAgICAqICAxICBUbyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHJvdW5kIHVwLiAgKFJPVU5EX0hBTEZfVVApXHJcbiAgICAgKiAgMiAgVG8gbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB0byBldmVuLiAgIChST1VORF9IQUxGX0VWRU4pXHJcbiAgICAgKiAgMyAgQXdheSBmcm9tIHplcm8uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChST1VORF9VUClcclxuICAgICAqL1xyXG4gICAgUk0gPSAxLCAgICAgICAgICAgICAvLyAwLCAxLCAyIG9yIDNcclxuXHJcbiAgICAvLyBUaGUgbWF4aW11bSB2YWx1ZSBvZiBEUCBhbmQgQmlnLkRQLlxyXG4gICAgTUFYX0RQID0gMUU2LCAgICAgICAvLyAwIHRvIDEwMDAwMDBcclxuXHJcbiAgICAvLyBUaGUgbWF4aW11bSBtYWduaXR1ZGUgb2YgdGhlIGV4cG9uZW50IGFyZ3VtZW50IHRvIHRoZSBwb3cgbWV0aG9kLlxyXG4gICAgTUFYX1BPV0VSID0gMUU2LCAgICAvLyAxIHRvIDEwMDAwMDBcclxuXHJcbiAgICAvKlxyXG4gICAgICogVGhlIG5lZ2F0aXZlIGV4cG9uZW50IChORSkgYXQgYW5kIGJlbmVhdGggd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAqIChKYXZhU2NyaXB0IG51bWJlcnM6IC03KVxyXG4gICAgICogLTEwMDAwMDAgaXMgdGhlIG1pbmltdW0gcmVjb21tZW5kZWQgZXhwb25lbnQgdmFsdWUgb2YgYSBCaWcuXHJcbiAgICAgKi9cclxuICAgIE5FID0gLTcsICAgICAgICAgICAgLy8gMCB0byAtMTAwMDAwMFxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBUaGUgcG9zaXRpdmUgZXhwb25lbnQgKFBFKSBhdCBhbmQgYWJvdmUgd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAqIChKYXZhU2NyaXB0IG51bWJlcnM6IDIxKVxyXG4gICAgICogMTAwMDAwMCBpcyB0aGUgbWF4aW11bSByZWNvbW1lbmRlZCBleHBvbmVudCB2YWx1ZSBvZiBhIEJpZy5cclxuICAgICAqIChUaGlzIGxpbWl0IGlzIG5vdCBlbmZvcmNlZCBvciBjaGVja2VkLilcclxuICAgICAqL1xyXG4gICAgUEUgPSAyMSwgICAgICAgICAgICAvLyAwIHRvIDEwMDAwMDBcclxuXHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgIC8vIEVycm9yIG1lc3NhZ2VzLlxyXG4gICAgTkFNRSA9ICdbYmlnLmpzXSAnLFxyXG4gICAgSU5WQUxJRCA9IE5BTUUgKyAnSW52YWxpZCAnLFxyXG4gICAgSU5WQUxJRF9EUCA9IElOVkFMSUQgKyAnZGVjaW1hbCBwbGFjZXMnLFxyXG4gICAgSU5WQUxJRF9STSA9IElOVkFMSUQgKyAncm91bmRpbmcgbW9kZScsXHJcbiAgICBESVZfQllfWkVSTyA9IE5BTUUgKyAnRGl2aXNpb24gYnkgemVybycsXHJcblxyXG4gICAgLy8gVGhlIHNoYXJlZCBwcm90b3R5cGUgb2JqZWN0LlxyXG4gICAgUCA9IHt9LFxyXG4gICAgVU5ERUZJTkVEID0gdm9pZCAwLFxyXG4gICAgTlVNRVJJQyA9IC9eLT8oXFxkKyhcXC5cXGQqKT98XFwuXFxkKykoZVsrLV0/XFxkKyk/JC9pO1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIEJpZyBjb25zdHJ1Y3Rvci5cclxuICAgKlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIF9CaWdfKCkge1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBUaGUgQmlnIGNvbnN0cnVjdG9yIGFuZCBleHBvcnRlZCBmdW5jdGlvbi5cclxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgbmV3IGluc3RhbmNlIG9mIGEgQmlnIG51bWJlciBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogbiB7bnVtYmVyfHN0cmluZ3xCaWd9IEEgbnVtZXJpYyB2YWx1ZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gQmlnKG4pIHtcclxuICAgICAgdmFyIHggPSB0aGlzO1xyXG5cclxuICAgICAgLy8gRW5hYmxlIGNvbnN0cnVjdG9yIHVzYWdlIHdpdGhvdXQgbmV3LlxyXG4gICAgICBpZiAoISh4IGluc3RhbmNlb2YgQmlnKSkgcmV0dXJuIG4gPT09IFVOREVGSU5FRCA/IF9CaWdfKCkgOiBuZXcgQmlnKG4pO1xyXG5cclxuICAgICAgLy8gRHVwbGljYXRlLlxyXG4gICAgICBpZiAobiBpbnN0YW5jZW9mIEJpZykge1xyXG4gICAgICAgIHgucyA9IG4ucztcclxuICAgICAgICB4LmUgPSBuLmU7XHJcbiAgICAgICAgeC5jID0gbi5jLnNsaWNlKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcGFyc2UoeCwgbik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qXHJcbiAgICAgICAqIFJldGFpbiBhIHJlZmVyZW5jZSB0byB0aGlzIEJpZyBjb25zdHJ1Y3RvciwgYW5kIHNoYWRvdyBCaWcucHJvdG90eXBlLmNvbnN0cnVjdG9yIHdoaWNoXHJcbiAgICAgICAqIHBvaW50cyB0byBPYmplY3QuXHJcbiAgICAgICAqL1xyXG4gICAgICB4LmNvbnN0cnVjdG9yID0gQmlnO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZy5wcm90b3R5cGUgPSBQO1xyXG4gICAgQmlnLkRQID0gRFA7XHJcbiAgICBCaWcuUk0gPSBSTTtcclxuICAgIEJpZy5ORSA9IE5FO1xyXG4gICAgQmlnLlBFID0gUEU7XHJcbiAgICBCaWcudmVyc2lvbiA9ICc1LjAuMic7XHJcblxyXG4gICAgcmV0dXJuIEJpZztcclxuICB9XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFBhcnNlIHRoZSBudW1iZXIgb3Igc3RyaW5nIHZhbHVlIHBhc3NlZCB0byBhIEJpZyBjb25zdHJ1Y3Rvci5cclxuICAgKlxyXG4gICAqIHgge0JpZ30gQSBCaWcgbnVtYmVyIGluc3RhbmNlLlxyXG4gICAqIG4ge251bWJlcnxzdHJpbmd9IEEgbnVtZXJpYyB2YWx1ZS5cclxuICAgKi9cclxuICBmdW5jdGlvbiBwYXJzZSh4LCBuKSB7XHJcbiAgICB2YXIgZSwgaSwgbmw7XHJcblxyXG4gICAgLy8gTWludXMgemVybz9cclxuICAgIGlmIChuID09PSAwICYmIDEgLyBuIDwgMCkgbiA9ICctMCc7XHJcbiAgICBlbHNlIGlmICghTlVNRVJJQy50ZXN0KG4gKz0gJycpKSB0aHJvdyBFcnJvcihJTlZBTElEICsgJ251bWJlcicpO1xyXG5cclxuICAgIC8vIERldGVybWluZSBzaWduLlxyXG4gICAgeC5zID0gbi5jaGFyQXQoMCkgPT0gJy0nID8gKG4gPSBuLnNsaWNlKDEpLCAtMSkgOiAxO1xyXG5cclxuICAgIC8vIERlY2ltYWwgcG9pbnQ/XHJcbiAgICBpZiAoKGUgPSBuLmluZGV4T2YoJy4nKSkgPiAtMSkgbiA9IG4ucmVwbGFjZSgnLicsICcnKTtcclxuXHJcbiAgICAvLyBFeHBvbmVudGlhbCBmb3JtP1xyXG4gICAgaWYgKChpID0gbi5zZWFyY2goL2UvaSkpID4gMCkge1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIGV4cG9uZW50LlxyXG4gICAgICBpZiAoZSA8IDApIGUgPSBpO1xyXG4gICAgICBlICs9ICtuLnNsaWNlKGkgKyAxKTtcclxuICAgICAgbiA9IG4uc3Vic3RyaW5nKDAsIGkpO1xyXG4gICAgfSBlbHNlIGlmIChlIDwgMCkge1xyXG5cclxuICAgICAgLy8gSW50ZWdlci5cclxuICAgICAgZSA9IG4ubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIG5sID0gbi5sZW5ndGg7XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lIGxlYWRpbmcgemVyb3MuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgbmwgJiYgbi5jaGFyQXQoaSkgPT0gJzAnOykgKytpO1xyXG5cclxuICAgIGlmIChpID09IG5sKSB7XHJcblxyXG4gICAgICAvLyBaZXJvLlxyXG4gICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICBmb3IgKDsgbmwgPiAwICYmIG4uY2hhckF0KC0tbmwpID09ICcwJzspO1xyXG4gICAgICB4LmUgPSBlIC0gaSAtIDE7XHJcbiAgICAgIHguYyA9IFtdO1xyXG5cclxuICAgICAgLy8gQ29udmVydCBzdHJpbmcgdG8gYXJyYXkgb2YgZGlnaXRzIHdpdGhvdXQgbGVhZGluZy90cmFpbGluZyB6ZXJvcy5cclxuICAgICAgZm9yIChlID0gMDsgaSA8PSBubDspIHguY1tlKytdID0gK24uY2hhckF0KGkrKyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHg7XHJcbiAgfVxyXG5cclxuXHJcbiAgLypcclxuICAgKiBSb3VuZCBCaWcgeCB0byBhIG1heGltdW0gb2YgZHAgZGVjaW1hbCBwbGFjZXMgdXNpbmcgcm91bmRpbmcgbW9kZSBybS5cclxuICAgKiBDYWxsZWQgYnkgc3RyaW5naWZ5LCBQLmRpdiwgUC5yb3VuZCBhbmQgUC5zcXJ0LlxyXG4gICAqXHJcbiAgICogeCB7QmlnfSBUaGUgQmlnIHRvIHJvdW5kLlxyXG4gICAqIGRwIHtudW1iZXJ9IEludGVnZXIsIDAgdG8gTUFYX0RQIGluY2x1c2l2ZS5cclxuICAgKiBybSB7bnVtYmVyfSAwLCAxLCAyIG9yIDMgKERPV04sIEhBTEZfVVAsIEhBTEZfRVZFTiwgVVApXHJcbiAgICogW21vcmVdIHtib29sZWFufSBXaGV0aGVyIHRoZSByZXN1bHQgb2YgZGl2aXNpb24gd2FzIHRydW5jYXRlZC5cclxuICAgKi9cclxuICBmdW5jdGlvbiByb3VuZCh4LCBkcCwgcm0sIG1vcmUpIHtcclxuICAgIHZhciB4YyA9IHguYyxcclxuICAgICAgaSA9IHguZSArIGRwICsgMTtcclxuXHJcbiAgICBpZiAoaSA8IHhjLmxlbmd0aCkge1xyXG4gICAgICBpZiAocm0gPT09IDEpIHtcclxuXHJcbiAgICAgICAgLy8geGNbaV0gaXMgdGhlIGRpZ2l0IGFmdGVyIHRoZSBkaWdpdCB0aGF0IG1heSBiZSByb3VuZGVkIHVwLlxyXG4gICAgICAgIG1vcmUgPSB4Y1tpXSA+PSA1O1xyXG4gICAgICB9IGVsc2UgaWYgKHJtID09PSAyKSB7XHJcbiAgICAgICAgbW9yZSA9IHhjW2ldID4gNSB8fCB4Y1tpXSA9PSA1ICYmXHJcbiAgICAgICAgICAobW9yZSB8fCBpIDwgMCB8fCB4Y1tpICsgMV0gIT09IFVOREVGSU5FRCB8fCB4Y1tpIC0gMV0gJiAxKTtcclxuICAgICAgfSBlbHNlIGlmIChybSA9PT0gMykge1xyXG4gICAgICAgIG1vcmUgPSBtb3JlIHx8IHhjW2ldICE9PSBVTkRFRklORUQgfHwgaSA8IDA7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbW9yZSA9IGZhbHNlO1xyXG4gICAgICAgIGlmIChybSAhPT0gMCkgdGhyb3cgRXJyb3IoSU5WQUxJRF9STSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChpIDwgMSkge1xyXG4gICAgICAgIHhjLmxlbmd0aCA9IDE7XHJcblxyXG4gICAgICAgIGlmIChtb3JlKSB7XHJcblxyXG4gICAgICAgICAgLy8gMSwgMC4xLCAwLjAxLCAwLjAwMSwgMC4wMDAxIGV0Yy5cclxuICAgICAgICAgIHguZSA9IC1kcDtcclxuICAgICAgICAgIHhjWzBdID0gMTtcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgICB4Y1swXSA9IHguZSA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBSZW1vdmUgYW55IGRpZ2l0cyBhZnRlciB0aGUgcmVxdWlyZWQgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgICAgeGMubGVuZ3RoID0gaS0tO1xyXG5cclxuICAgICAgICAvLyBSb3VuZCB1cD9cclxuICAgICAgICBpZiAobW9yZSkge1xyXG5cclxuICAgICAgICAgIC8vIFJvdW5kaW5nIHVwIG1heSBtZWFuIHRoZSBwcmV2aW91cyBkaWdpdCBoYXMgdG8gYmUgcm91bmRlZCB1cC5cclxuICAgICAgICAgIGZvciAoOyArK3hjW2ldID4gOTspIHtcclxuICAgICAgICAgICAgeGNbaV0gPSAwO1xyXG4gICAgICAgICAgICBpZiAoIWktLSkge1xyXG4gICAgICAgICAgICAgICsreC5lO1xyXG4gICAgICAgICAgICAgIHhjLnVuc2hpZnQoMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICBmb3IgKGkgPSB4Yy5sZW5ndGg7ICF4Y1stLWldOykgeGMucG9wKCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAocm0gPCAwIHx8IHJtID4gMyB8fCBybSAhPT0gfn5ybSkge1xyXG4gICAgICB0aHJvdyBFcnJvcihJTlZBTElEX1JNKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geDtcclxuICB9XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIEJpZyB4IGluIG5vcm1hbCBvciBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgKiBIYW5kbGVzIFAudG9FeHBvbmVudGlhbCwgUC50b0ZpeGVkLCBQLnRvSlNPTiwgUC50b1ByZWNpc2lvbiwgUC50b1N0cmluZyBhbmQgUC52YWx1ZU9mLlxyXG4gICAqXHJcbiAgICogeCB7QmlnfVxyXG4gICAqIGlkPyB7bnVtYmVyfSBDYWxsZXIgaWQuXHJcbiAgICogICAgICAgICAxIHRvRXhwb25lbnRpYWxcclxuICAgKiAgICAgICAgIDIgdG9GaXhlZFxyXG4gICAqICAgICAgICAgMyB0b1ByZWNpc2lvblxyXG4gICAqICAgICAgICAgNCB2YWx1ZU9mXHJcbiAgICogbj8ge251bWJlcnx1bmRlZmluZWR9IENhbGxlcidzIGFyZ3VtZW50LlxyXG4gICAqIGs/IHtudW1iZXJ8dW5kZWZpbmVkfVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHN0cmluZ2lmeSh4LCBpZCwgbiwgaykge1xyXG4gICAgdmFyIGUsIHMsXHJcbiAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgIHogPSAheC5jWzBdO1xyXG5cclxuICAgIGlmIChuICE9PSBVTkRFRklORUQpIHtcclxuICAgICAgaWYgKG4gIT09IH5+biB8fCBuIDwgKGlkID09IDMpIHx8IG4gPiBNQVhfRFApIHtcclxuICAgICAgICB0aHJvdyBFcnJvcihpZCA9PSAzID8gSU5WQUxJRCArICdwcmVjaXNpb24nIDogSU5WQUxJRF9EUCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHggPSBuZXcgQmlnKHgpO1xyXG5cclxuICAgICAgLy8gVGhlIGluZGV4IG9mIHRoZSBkaWdpdCB0aGF0IG1heSBiZSByb3VuZGVkIHVwLlxyXG4gICAgICBuID0gayAtIHguZTtcclxuXHJcbiAgICAgIC8vIFJvdW5kP1xyXG4gICAgICBpZiAoeC5jLmxlbmd0aCA+ICsraykgcm91bmQoeCwgbiwgQmlnLlJNKTtcclxuXHJcbiAgICAgIC8vIHRvRml4ZWQ6IHJlY2FsY3VsYXRlIGsgYXMgeC5lIG1heSBoYXZlIGNoYW5nZWQgaWYgdmFsdWUgcm91bmRlZCB1cC5cclxuICAgICAgaWYgKGlkID09IDIpIGsgPSB4LmUgKyBuICsgMTtcclxuXHJcbiAgICAgIC8vIEFwcGVuZCB6ZXJvcz9cclxuICAgICAgZm9yICg7IHguYy5sZW5ndGggPCBrOykgeC5jLnB1c2goMCk7XHJcbiAgICB9XHJcblxyXG4gICAgZSA9IHguZTtcclxuICAgIHMgPSB4LmMuam9pbignJyk7XHJcbiAgICBuID0gcy5sZW5ndGg7XHJcblxyXG4gICAgLy8gRXhwb25lbnRpYWwgbm90YXRpb24/XHJcbiAgICBpZiAoaWQgIT0gMiAmJiAoaWQgPT0gMSB8fCBpZCA9PSAzICYmIGsgPD0gZSB8fCBlIDw9IEJpZy5ORSB8fCBlID49IEJpZy5QRSkpIHtcclxuICAgICAgcyA9IHMuY2hhckF0KDApICsgKG4gPiAxID8gJy4nICsgcy5zbGljZSgxKSA6ICcnKSArIChlIDwgMCA/ICdlJyA6ICdlKycpICsgZTtcclxuXHJcbiAgICAvLyBOb3JtYWwgbm90YXRpb24uXHJcbiAgICB9IGVsc2UgaWYgKGUgPCAwKSB7XHJcbiAgICAgIGZvciAoOyArK2U7KSBzID0gJzAnICsgcztcclxuICAgICAgcyA9ICcwLicgKyBzO1xyXG4gICAgfSBlbHNlIGlmIChlID4gMCkge1xyXG4gICAgICBpZiAoKytlID4gbikgZm9yIChlIC09IG47IGUtLTspIHMgKz0gJzAnO1xyXG4gICAgICBlbHNlIGlmIChlIDwgbikgcyA9IHMuc2xpY2UoMCwgZSkgKyAnLicgKyBzLnNsaWNlKGUpO1xyXG4gICAgfSBlbHNlIGlmIChuID4gMSkge1xyXG4gICAgICBzID0gcy5jaGFyQXQoMCkgKyAnLicgKyBzLnNsaWNlKDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB4LnMgPCAwICYmICgheiB8fCBpZCA9PSA0KSA/ICctJyArIHMgOiBzO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIFByb3RvdHlwZS9pbnN0YW5jZSBtZXRob2RzXHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIGFic29sdXRlIHZhbHVlIG9mIHRoaXMgQmlnLlxyXG4gICAqL1xyXG4gIFAuYWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHggPSBuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzKTtcclxuICAgIHgucyA9IDE7XHJcbiAgICByZXR1cm4geDtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gMSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaXMgZ3JlYXRlciB0aGFuIHRoZSB2YWx1ZSBvZiBCaWcgeSxcclxuICAgKiAgICAgICAtMSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaXMgbGVzcyB0aGFuIHRoZSB2YWx1ZSBvZiBCaWcgeSwgb3JcclxuICAgKiAgICAgICAgMCBpZiB0aGV5IGhhdmUgdGhlIHNhbWUgdmFsdWUuXHJcbiAgKi9cclxuICBQLmNtcCA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICB2YXIgaXNuZWcsXHJcbiAgICAgIHggPSB0aGlzLFxyXG4gICAgICB4YyA9IHguYyxcclxuICAgICAgeWMgPSAoeSA9IG5ldyB4LmNvbnN0cnVjdG9yKHkpKS5jLFxyXG4gICAgICBpID0geC5zLFxyXG4gICAgICBqID0geS5zLFxyXG4gICAgICBrID0geC5lLFxyXG4gICAgICBsID0geS5lO1xyXG5cclxuICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHJldHVybiAheGNbMF0gPyAheWNbMF0gPyAwIDogLWogOiBpO1xyXG5cclxuICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgIGlmIChpICE9IGopIHJldHVybiBpO1xyXG5cclxuICAgIGlzbmVnID0gaSA8IDA7XHJcblxyXG4gICAgLy8gQ29tcGFyZSBleHBvbmVudHMuXHJcbiAgICBpZiAoayAhPSBsKSByZXR1cm4gayA+IGwgXiBpc25lZyA/IDEgOiAtMTtcclxuXHJcbiAgICBqID0gKGsgPSB4Yy5sZW5ndGgpIDwgKGwgPSB5Yy5sZW5ndGgpID8gayA6IGw7XHJcblxyXG4gICAgLy8gQ29tcGFyZSBkaWdpdCBieSBkaWdpdC5cclxuICAgIGZvciAoaSA9IC0xOyArK2kgPCBqOykge1xyXG4gICAgICBpZiAoeGNbaV0gIT0geWNbaV0pIHJldHVybiB4Y1tpXSA+IHljW2ldIF4gaXNuZWcgPyAxIDogLTE7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29tcGFyZSBsZW5ndGhzLlxyXG4gICAgcmV0dXJuIGsgPT0gbCA/IDAgOiBrID4gbCBeIGlzbmVnID8gMSA6IC0xO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGRpdmlkZWQgYnkgdGhlIHZhbHVlIG9mIEJpZyB5LCByb3VuZGVkLFxyXG4gICAqIGlmIG5lY2Vzc2FyeSwgdG8gYSBtYXhpbXVtIG9mIEJpZy5EUCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIEJpZy5STS5cclxuICAgKi9cclxuICBQLmRpdiA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICB2YXIgeCA9IHRoaXMsXHJcbiAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgIGEgPSB4LmMsICAgICAgICAgICAgICAgICAgLy8gZGl2aWRlbmRcclxuICAgICAgYiA9ICh5ID0gbmV3IEJpZyh5KSkuYywgICAvLyBkaXZpc29yXHJcbiAgICAgIGsgPSB4LnMgPT0geS5zID8gMSA6IC0xLFxyXG4gICAgICBkcCA9IEJpZy5EUDtcclxuXHJcbiAgICBpZiAoZHAgIT09IH5+ZHAgfHwgZHAgPCAwIHx8IGRwID4gTUFYX0RQKSB0aHJvdyBFcnJvcihJTlZBTElEX0RQKTtcclxuXHJcbiAgICAvLyBEaXZpc29yIGlzIHplcm8/XHJcbiAgICBpZiAoIWJbMF0pIHRocm93IEVycm9yKERJVl9CWV9aRVJPKTtcclxuXHJcbiAgICAvLyBEaXZpZGVuZCBpcyAwPyBSZXR1cm4gKy0wLlxyXG4gICAgaWYgKCFhWzBdKSByZXR1cm4gbmV3IEJpZyhrICogMCk7XHJcblxyXG4gICAgdmFyIGJsLCBidCwgbiwgY21wLCByaSxcclxuICAgICAgYnogPSBiLnNsaWNlKCksXHJcbiAgICAgIGFpID0gYmwgPSBiLmxlbmd0aCxcclxuICAgICAgYWwgPSBhLmxlbmd0aCxcclxuICAgICAgciA9IGEuc2xpY2UoMCwgYmwpLCAgIC8vIHJlbWFpbmRlclxyXG4gICAgICBybCA9IHIubGVuZ3RoLFxyXG4gICAgICBxID0geSwgICAgICAgICAgICAgICAgLy8gcXVvdGllbnRcclxuICAgICAgcWMgPSBxLmMgPSBbXSxcclxuICAgICAgcWkgPSAwLFxyXG4gICAgICBkID0gZHAgKyAocS5lID0geC5lIC0geS5lKSArIDE7ICAgIC8vIG51bWJlciBvZiBkaWdpdHMgb2YgdGhlIHJlc3VsdFxyXG5cclxuICAgIHEucyA9IGs7XHJcbiAgICBrID0gZCA8IDAgPyAwIDogZDtcclxuXHJcbiAgICAvLyBDcmVhdGUgdmVyc2lvbiBvZiBkaXZpc29yIHdpdGggbGVhZGluZyB6ZXJvLlxyXG4gICAgYnoudW5zaGlmdCgwKTtcclxuXHJcbiAgICAvLyBBZGQgemVyb3MgdG8gbWFrZSByZW1haW5kZXIgYXMgbG9uZyBhcyBkaXZpc29yLlxyXG4gICAgZm9yICg7IHJsKysgPCBibDspIHIucHVzaCgwKTtcclxuXHJcbiAgICBkbyB7XHJcblxyXG4gICAgICAvLyBuIGlzIGhvdyBtYW55IHRpbWVzIHRoZSBkaXZpc29yIGdvZXMgaW50byBjdXJyZW50IHJlbWFpbmRlci5cclxuICAgICAgZm9yIChuID0gMDsgbiA8IDEwOyBuKyspIHtcclxuXHJcbiAgICAgICAgLy8gQ29tcGFyZSBkaXZpc29yIGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgaWYgKGJsICE9IChybCA9IHIubGVuZ3RoKSkge1xyXG4gICAgICAgICAgY21wID0gYmwgPiBybCA/IDEgOiAtMTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZm9yIChyaSA9IC0xLCBjbXAgPSAwOyArK3JpIDwgYmw7KSB7XHJcbiAgICAgICAgICAgIGlmIChiW3JpXSAhPSByW3JpXSkge1xyXG4gICAgICAgICAgICAgIGNtcCA9IGJbcmldID4gcltyaV0gPyAxIDogLTE7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIGRpdmlzb3IgPCByZW1haW5kZXIsIHN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgaWYgKGNtcCA8IDApIHtcclxuXHJcbiAgICAgICAgICAvLyBSZW1haW5kZXIgY2FuJ3QgYmUgbW9yZSB0aGFuIDEgZGlnaXQgbG9uZ2VyIHRoYW4gZGl2aXNvci5cclxuICAgICAgICAgIC8vIEVxdWFsaXNlIGxlbmd0aHMgdXNpbmcgZGl2aXNvciB3aXRoIGV4dHJhIGxlYWRpbmcgemVybz9cclxuICAgICAgICAgIGZvciAoYnQgPSBybCA9PSBibCA/IGIgOiBiejsgcmw7KSB7XHJcbiAgICAgICAgICAgIGlmIChyWy0tcmxdIDwgYnRbcmxdKSB7XHJcbiAgICAgICAgICAgICAgcmkgPSBybDtcclxuICAgICAgICAgICAgICBmb3IgKDsgcmkgJiYgIXJbLS1yaV07KSByW3JpXSA9IDk7XHJcbiAgICAgICAgICAgICAgLS1yW3JpXTtcclxuICAgICAgICAgICAgICByW3JsXSArPSAxMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByW3JsXSAtPSBidFtybF07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgZm9yICg7ICFyWzBdOykgci5zaGlmdCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFkZCB0aGUgZGlnaXQgbiB0byB0aGUgcmVzdWx0IGFycmF5LlxyXG4gICAgICBxY1txaSsrXSA9IGNtcCA/IG4gOiArK247XHJcblxyXG4gICAgICAvLyBVcGRhdGUgdGhlIHJlbWFpbmRlci5cclxuICAgICAgaWYgKHJbMF0gJiYgY21wKSByW3JsXSA9IGFbYWldIHx8IDA7XHJcbiAgICAgIGVsc2UgciA9IFthW2FpXV07XHJcblxyXG4gICAgfSB3aGlsZSAoKGFpKysgPCBhbCB8fCByWzBdICE9PSBVTkRFRklORUQpICYmIGstLSk7XHJcblxyXG4gICAgLy8gTGVhZGluZyB6ZXJvPyBEbyBub3QgcmVtb3ZlIGlmIHJlc3VsdCBpcyBzaW1wbHkgemVybyAocWkgPT0gMSkuXHJcbiAgICBpZiAoIXFjWzBdICYmIHFpICE9IDEpIHtcclxuXHJcbiAgICAgIC8vIFRoZXJlIGNhbid0IGJlIG1vcmUgdGhhbiBvbmUgemVyby5cclxuICAgICAgcWMuc2hpZnQoKTtcclxuICAgICAgcS5lLS07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUm91bmQ/XHJcbiAgICBpZiAocWkgPiBkKSByb3VuZChxLCBkcCwgQmlnLlJNLCByWzBdICE9PSBVTkRFRklORUQpO1xyXG5cclxuICAgIHJldHVybiBxO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBlcXVhbCB0byB0aGUgdmFsdWUgb2YgQmlnIHksIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICovXHJcbiAgUC5lcSA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICByZXR1cm4gIXRoaXMuY21wKHkpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBncmVhdGVyIHRoYW4gdGhlIHZhbHVlIG9mIEJpZyB5LCBvdGhlcndpc2UgcmV0dXJuXHJcbiAgICogZmFsc2UuXHJcbiAgICovXHJcbiAgUC5ndCA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5jbXAoeSkgPiAwO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHZhbHVlIG9mIEJpZyB5LCBvdGhlcndpc2VcclxuICAgKiByZXR1cm4gZmFsc2UuXHJcbiAgICovXHJcbiAgUC5ndGUgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgcmV0dXJuIHRoaXMuY21wKHkpID4gLTE7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qXHJcbiAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnIHksIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICovXHJcbiAgUC5sdCA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5jbXAoeSkgPCAwO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHZhbHVlIG9mIEJpZyB5LCBvdGhlcndpc2VcclxuICAgKiByZXR1cm4gZmFsc2UuXHJcbiAgICovXHJcbiAgUC5sdGUgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgcmV0dXJuIHRoaXMuY21wKHkpIDwgMTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBtaW51cyB0aGUgdmFsdWUgb2YgQmlnIHkuXHJcbiAgICovXHJcbiAgUC5taW51cyA9IFAuc3ViID0gZnVuY3Rpb24gKHkpIHtcclxuICAgIHZhciBpLCBqLCB0LCB4bHR5LFxyXG4gICAgICB4ID0gdGhpcyxcclxuICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgYSA9IHgucyxcclxuICAgICAgYiA9ICh5ID0gbmV3IEJpZyh5KSkucztcclxuXHJcbiAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICBpZiAoYSAhPSBiKSB7XHJcbiAgICAgIHkucyA9IC1iO1xyXG4gICAgICByZXR1cm4geC5wbHVzKHkpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB4YyA9IHguYy5zbGljZSgpLFxyXG4gICAgICB4ZSA9IHguZSxcclxuICAgICAgeWMgPSB5LmMsXHJcbiAgICAgIHllID0geS5lO1xyXG5cclxuICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHtcclxuXHJcbiAgICAgIC8vIHkgaXMgbm9uLXplcm8/IHggaXMgbm9uLXplcm8/IE9yIGJvdGggYXJlIHplcm8uXHJcbiAgICAgIHJldHVybiB5Y1swXSA/ICh5LnMgPSAtYiwgeSkgOiBuZXcgQmlnKHhjWzBdID8geCA6IDApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERldGVybWluZSB3aGljaCBpcyB0aGUgYmlnZ2VyIG51bWJlci4gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICBpZiAoYSA9IHhlIC0geWUpIHtcclxuXHJcbiAgICAgIGlmICh4bHR5ID0gYSA8IDApIHtcclxuICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgdCA9IHhjO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHllID0geGU7XHJcbiAgICAgICAgdCA9IHljO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgZm9yIChiID0gYTsgYi0tOykgdC5wdXNoKDApO1xyXG4gICAgICB0LnJldmVyc2UoKTtcclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAvLyBFeHBvbmVudHMgZXF1YWwuIENoZWNrIGRpZ2l0IGJ5IGRpZ2l0LlxyXG4gICAgICBqID0gKCh4bHR5ID0geGMubGVuZ3RoIDwgeWMubGVuZ3RoKSA/IHhjIDogeWMpLmxlbmd0aDtcclxuXHJcbiAgICAgIGZvciAoYSA9IGIgPSAwOyBiIDwgajsgYisrKSB7XHJcbiAgICAgICAgaWYgKHhjW2JdICE9IHljW2JdKSB7XHJcbiAgICAgICAgICB4bHR5ID0geGNbYl0gPCB5Y1tiXTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHggPCB5PyBQb2ludCB4YyB0byB0aGUgYXJyYXkgb2YgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICBpZiAoeGx0eSkge1xyXG4gICAgICB0ID0geGM7XHJcbiAgICAgIHhjID0geWM7XHJcbiAgICAgIHljID0gdDtcclxuICAgICAgeS5zID0gLXkucztcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogQXBwZW5kIHplcm9zIHRvIHhjIGlmIHNob3J0ZXIuIE5vIG5lZWQgdG8gYWRkIHplcm9zIHRvIHljIGlmIHNob3J0ZXIgYXMgc3VidHJhY3Rpb24gb25seVxyXG4gICAgICogbmVlZHMgdG8gc3RhcnQgYXQgeWMubGVuZ3RoLlxyXG4gICAgICovXHJcbiAgICBpZiAoKGIgPSAoaiA9IHljLmxlbmd0aCkgLSAoaSA9IHhjLmxlbmd0aCkpID4gMCkgZm9yICg7IGItLTspIHhjW2krK10gPSAwO1xyXG5cclxuICAgIC8vIFN1YnRyYWN0IHljIGZyb20geGMuXHJcbiAgICBmb3IgKGIgPSBpOyBqID4gYTspIHtcclxuICAgICAgaWYgKHhjWy0tal0gPCB5Y1tqXSkge1xyXG4gICAgICAgIGZvciAoaSA9IGo7IGkgJiYgIXhjWy0taV07KSB4Y1tpXSA9IDk7XHJcbiAgICAgICAgLS14Y1tpXTtcclxuICAgICAgICB4Y1tqXSArPSAxMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgeGNbal0gLT0geWNbal07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgZm9yICg7IHhjWy0tYl0gPT09IDA7KSB4Yy5wb3AoKTtcclxuXHJcbiAgICAvLyBSZW1vdmUgbGVhZGluZyB6ZXJvcyBhbmQgYWRqdXN0IGV4cG9uZW50IGFjY29yZGluZ2x5LlxyXG4gICAgZm9yICg7IHhjWzBdID09PSAwOykge1xyXG4gICAgICB4Yy5zaGlmdCgpO1xyXG4gICAgICAtLXllO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgheGNbMF0pIHtcclxuXHJcbiAgICAgIC8vIG4gLSBuID0gKzBcclxuICAgICAgeS5zID0gMTtcclxuXHJcbiAgICAgIC8vIFJlc3VsdCBtdXN0IGJlIHplcm8uXHJcbiAgICAgIHhjID0gW3llID0gMF07XHJcbiAgICB9XHJcblxyXG4gICAgeS5jID0geGM7XHJcbiAgICB5LmUgPSB5ZTtcclxuXHJcbiAgICByZXR1cm4geTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBtb2R1bG8gdGhlIHZhbHVlIG9mIEJpZyB5LlxyXG4gICAqL1xyXG4gIFAubW9kID0gZnVuY3Rpb24gKHkpIHtcclxuICAgIHZhciB5Z3R4LFxyXG4gICAgICB4ID0gdGhpcyxcclxuICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgYSA9IHgucyxcclxuICAgICAgYiA9ICh5ID0gbmV3IEJpZyh5KSkucztcclxuXHJcbiAgICBpZiAoIXkuY1swXSkgdGhyb3cgRXJyb3IoRElWX0JZX1pFUk8pO1xyXG5cclxuICAgIHgucyA9IHkucyA9IDE7XHJcbiAgICB5Z3R4ID0geS5jbXAoeCkgPT0gMTtcclxuICAgIHgucyA9IGE7XHJcbiAgICB5LnMgPSBiO1xyXG5cclxuICAgIGlmICh5Z3R4KSByZXR1cm4gbmV3IEJpZyh4KTtcclxuXHJcbiAgICBhID0gQmlnLkRQO1xyXG4gICAgYiA9IEJpZy5STTtcclxuICAgIEJpZy5EUCA9IEJpZy5STSA9IDA7XHJcbiAgICB4ID0geC5kaXYoeSk7XHJcbiAgICBCaWcuRFAgPSBhO1xyXG4gICAgQmlnLlJNID0gYjtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5taW51cyh4LnRpbWVzKHkpKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBwbHVzIHRoZSB2YWx1ZSBvZiBCaWcgeS5cclxuICAgKi9cclxuICBQLnBsdXMgPSBQLmFkZCA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICB2YXIgdCxcclxuICAgICAgeCA9IHRoaXMsXHJcbiAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgIGEgPSB4LnMsXHJcbiAgICAgIGIgPSAoeSA9IG5ldyBCaWcoeSkpLnM7XHJcblxyXG4gICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgaWYgKGEgIT0gYikge1xyXG4gICAgICB5LnMgPSAtYjtcclxuICAgICAgcmV0dXJuIHgubWludXMoeSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHhlID0geC5lLFxyXG4gICAgICB4YyA9IHguYyxcclxuICAgICAgeWUgPSB5LmUsXHJcbiAgICAgIHljID0geS5jO1xyXG5cclxuICAgIC8vIEVpdGhlciB6ZXJvPyB5IGlzIG5vbi16ZXJvPyB4IGlzIG5vbi16ZXJvPyBPciBib3RoIGFyZSB6ZXJvLlxyXG4gICAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHJldHVybiB5Y1swXSA/IHkgOiBuZXcgQmlnKHhjWzBdID8geCA6IGEgKiAwKTtcclxuXHJcbiAgICB4YyA9IHhjLnNsaWNlKCk7XHJcblxyXG4gICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICAvLyBOb3RlOiBGYXN0ZXIgdG8gdXNlIHJldmVyc2UgdGhlbiBkbyB1bnNoaWZ0cy5cclxuICAgIGlmIChhID0geGUgLSB5ZSkge1xyXG4gICAgICBpZiAoYSA+IDApIHtcclxuICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgIHQgPSB5YztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgdCA9IHhjO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgZm9yICg7IGEtLTspIHQucHVzaCgwKTtcclxuICAgICAgdC5yZXZlcnNlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUG9pbnQgeGMgdG8gdGhlIGxvbmdlciBhcnJheS5cclxuICAgIGlmICh4Yy5sZW5ndGggLSB5Yy5sZW5ndGggPCAwKSB7XHJcbiAgICAgIHQgPSB5YztcclxuICAgICAgeWMgPSB4YztcclxuICAgICAgeGMgPSB0O1xyXG4gICAgfVxyXG5cclxuICAgIGEgPSB5Yy5sZW5ndGg7XHJcblxyXG4gICAgLy8gT25seSBzdGFydCBhZGRpbmcgYXQgeWMubGVuZ3RoIC0gMSBhcyB0aGUgZnVydGhlciBkaWdpdHMgb2YgeGMgY2FuIGJlIGxlZnQgYXMgdGhleSBhcmUuXHJcbiAgICBmb3IgKGIgPSAwOyBhOyB4Y1thXSAlPSAxMCkgYiA9ICh4Y1stLWFdID0geGNbYV0gKyB5Y1thXSArIGIpIC8gMTAgfCAwO1xyXG5cclxuICAgIC8vIE5vIG5lZWQgdG8gY2hlY2sgZm9yIHplcm8sIGFzICt4ICsgK3kgIT0gMCAmJiAteCArIC15ICE9IDBcclxuXHJcbiAgICBpZiAoYikge1xyXG4gICAgICB4Yy51bnNoaWZ0KGIpO1xyXG4gICAgICArK3llO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgIGZvciAoYSA9IHhjLmxlbmd0aDsgeGNbLS1hXSA9PT0gMDspIHhjLnBvcCgpO1xyXG5cclxuICAgIHkuYyA9IHhjO1xyXG4gICAgeS5lID0geWU7XHJcblxyXG4gICAgcmV0dXJuIHk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qXHJcbiAgICogUmV0dXJuIGEgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyByYWlzZWQgdG8gdGhlIHBvd2VyIG4uXHJcbiAgICogSWYgbiBpcyBuZWdhdGl2ZSwgcm91bmQgdG8gYSBtYXhpbXVtIG9mIEJpZy5EUCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZ1xyXG4gICAqIG1vZGUgQmlnLlJNLlxyXG4gICAqXHJcbiAgICogbiB7bnVtYmVyfSBJbnRlZ2VyLCAtTUFYX1BPV0VSIHRvIE1BWF9QT1dFUiBpbmNsdXNpdmUuXHJcbiAgICovXHJcbiAgUC5wb3cgPSBmdW5jdGlvbiAobikge1xyXG4gICAgdmFyIHggPSB0aGlzLFxyXG4gICAgICBvbmUgPSBuZXcgeC5jb25zdHJ1Y3RvcigxKSxcclxuICAgICAgeSA9IG9uZSxcclxuICAgICAgaXNuZWcgPSBuIDwgMDtcclxuXHJcbiAgICBpZiAobiAhPT0gfn5uIHx8IG4gPCAtTUFYX1BPV0VSIHx8IG4gPiBNQVhfUE9XRVIpIHRocm93IEVycm9yKElOVkFMSUQgKyAnZXhwb25lbnQnKTtcclxuICAgIGlmIChpc25lZykgbiA9IC1uO1xyXG5cclxuICAgIGZvciAoOzspIHtcclxuICAgICAgaWYgKG4gJiAxKSB5ID0geS50aW1lcyh4KTtcclxuICAgICAgbiA+Pj0gMTtcclxuICAgICAgaWYgKCFuKSBicmVhaztcclxuICAgICAgeCA9IHgudGltZXMoeCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGlzbmVnID8gb25lLmRpdih5KSA6IHk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qXHJcbiAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgcm91bmRlZCB0byBhIG1heGltdW0gb2YgZHAgZGVjaW1hbFxyXG4gICAqIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLlxyXG4gICAqIElmIGRwIGlzIG5vdCBzcGVjaWZpZWQsIHJvdW5kIHRvIDAgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICogSWYgcm0gaXMgbm90IHNwZWNpZmllZCwgdXNlIEJpZy5STS5cclxuICAgKlxyXG4gICAqIGRwPyB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICogcm0/IDAsIDEsIDIgb3IgMyAoUk9VTkRfRE9XTiwgUk9VTkRfSEFMRl9VUCwgUk9VTkRfSEFMRl9FVkVOLCBST1VORF9VUClcclxuICAgKi9cclxuICBQLnJvdW5kID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gICAgdmFyIEJpZyA9IHRoaXMuY29uc3RydWN0b3I7XHJcbiAgICBpZiAoZHAgPT09IFVOREVGSU5FRCkgZHAgPSAwO1xyXG4gICAgZWxzZSBpZiAoZHAgIT09IH5+ZHAgfHwgZHAgPCAwIHx8IGRwID4gTUFYX0RQKSB0aHJvdyBFcnJvcihJTlZBTElEX0RQKTtcclxuICAgIHJldHVybiByb3VuZChuZXcgQmlnKHRoaXMpLCBkcCwgcm0gPT09IFVOREVGSU5FRCA/IEJpZy5STSA6IHJtKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSBzcXVhcmUgcm9vdCBvZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcsIHJvdW5kZWQsIGlmXHJcbiAgICogbmVjZXNzYXJ5LCB0byBhIG1heGltdW0gb2YgQmlnLkRQIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgQmlnLlJNLlxyXG4gICAqL1xyXG4gIFAuc3FydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciByLCBjLCB0LFxyXG4gICAgICB4ID0gdGhpcyxcclxuICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgcyA9IHgucyxcclxuICAgICAgZSA9IHguZSxcclxuICAgICAgaGFsZiA9IG5ldyBCaWcoMC41KTtcclxuXHJcbiAgICAvLyBaZXJvP1xyXG4gICAgaWYgKCF4LmNbMF0pIHJldHVybiBuZXcgQmlnKHgpO1xyXG5cclxuICAgIC8vIE5lZ2F0aXZlP1xyXG4gICAgaWYgKHMgPCAwKSB0aHJvdyBFcnJvcihOQU1FICsgJ05vIHNxdWFyZSByb290Jyk7XHJcblxyXG4gICAgLy8gRXN0aW1hdGUuXHJcbiAgICBzID0gTWF0aC5zcXJ0KHgudG9TdHJpbmcoKSk7XHJcblxyXG4gICAgLy8gTWF0aC5zcXJ0IHVuZGVyZmxvdy9vdmVyZmxvdz9cclxuICAgIC8vIFJlLWVzdGltYXRlOiBwYXNzIHggdG8gTWF0aC5zcXJ0IGFzIGludGVnZXIsIHRoZW4gYWRqdXN0IHRoZSByZXN1bHQgZXhwb25lbnQuXHJcbiAgICBpZiAocyA9PT0gMCB8fCBzID09PSAxIC8gMCkge1xyXG4gICAgICBjID0geC5jLmpvaW4oJycpO1xyXG4gICAgICBpZiAoIShjLmxlbmd0aCArIGUgJiAxKSkgYyArPSAnMCc7XHJcbiAgICAgIHIgPSBuZXcgQmlnKE1hdGguc3FydChjKS50b1N0cmluZygpKTtcclxuICAgICAgci5lID0gKChlICsgMSkgLyAyIHwgMCkgLSAoZSA8IDAgfHwgZSAmIDEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgciA9IG5ldyBCaWcocy50b1N0cmluZygpKTtcclxuICAgIH1cclxuXHJcbiAgICBlID0gci5lICsgKEJpZy5EUCArPSA0KTtcclxuXHJcbiAgICAvLyBOZXd0b24tUmFwaHNvbiBpdGVyYXRpb24uXHJcbiAgICBkbyB7XHJcbiAgICAgIHQgPSByO1xyXG4gICAgICByID0gaGFsZi50aW1lcyh0LnBsdXMoeC5kaXYodCkpKTtcclxuICAgIH0gd2hpbGUgKHQuYy5zbGljZSgwLCBlKS5qb2luKCcnKSAhPT0gci5jLnNsaWNlKDAsIGUpLmpvaW4oJycpKTtcclxuXHJcbiAgICByZXR1cm4gcm91bmQociwgQmlnLkRQIC09IDQsIEJpZy5STSk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qXHJcbiAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgdGltZXMgdGhlIHZhbHVlIG9mIEJpZyB5LlxyXG4gICAqL1xyXG4gIFAudGltZXMgPSBQLm11bCA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICB2YXIgYyxcclxuICAgICAgeCA9IHRoaXMsXHJcbiAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgIHhjID0geC5jLFxyXG4gICAgICB5YyA9ICh5ID0gbmV3IEJpZyh5KSkuYyxcclxuICAgICAgYSA9IHhjLmxlbmd0aCxcclxuICAgICAgYiA9IHljLmxlbmd0aCxcclxuICAgICAgaSA9IHguZSxcclxuICAgICAgaiA9IHkuZTtcclxuXHJcbiAgICAvLyBEZXRlcm1pbmUgc2lnbiBvZiByZXN1bHQuXHJcbiAgICB5LnMgPSB4LnMgPT0geS5zID8gMSA6IC0xO1xyXG5cclxuICAgIC8vIFJldHVybiBzaWduZWQgMCBpZiBlaXRoZXIgMC5cclxuICAgIGlmICgheGNbMF0gfHwgIXljWzBdKSByZXR1cm4gbmV3IEJpZyh5LnMgKiAwKTtcclxuXHJcbiAgICAvLyBJbml0aWFsaXNlIGV4cG9uZW50IG9mIHJlc3VsdCBhcyB4LmUgKyB5LmUuXHJcbiAgICB5LmUgPSBpICsgajtcclxuXHJcbiAgICAvLyBJZiBhcnJheSB4YyBoYXMgZmV3ZXIgZGlnaXRzIHRoYW4geWMsIHN3YXAgeGMgYW5kIHljLCBhbmQgbGVuZ3Rocy5cclxuICAgIGlmIChhIDwgYikge1xyXG4gICAgICBjID0geGM7XHJcbiAgICAgIHhjID0geWM7XHJcbiAgICAgIHljID0gYztcclxuICAgICAgaiA9IGE7XHJcbiAgICAgIGEgPSBiO1xyXG4gICAgICBiID0gajtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJbml0aWFsaXNlIGNvZWZmaWNpZW50IGFycmF5IG9mIHJlc3VsdCB3aXRoIHplcm9zLlxyXG4gICAgZm9yIChjID0gbmV3IEFycmF5KGogPSBhICsgYik7IGotLTspIGNbal0gPSAwO1xyXG5cclxuICAgIC8vIE11bHRpcGx5LlxyXG5cclxuICAgIC8vIGkgaXMgaW5pdGlhbGx5IHhjLmxlbmd0aC5cclxuICAgIGZvciAoaSA9IGI7IGktLTspIHtcclxuICAgICAgYiA9IDA7XHJcblxyXG4gICAgICAvLyBhIGlzIHljLmxlbmd0aC5cclxuICAgICAgZm9yIChqID0gYSArIGk7IGogPiBpOykge1xyXG5cclxuICAgICAgICAvLyBDdXJyZW50IHN1bSBvZiBwcm9kdWN0cyBhdCB0aGlzIGRpZ2l0IHBvc2l0aW9uLCBwbHVzIGNhcnJ5LlxyXG4gICAgICAgIGIgPSBjW2pdICsgeWNbaV0gKiB4Y1tqIC0gaSAtIDFdICsgYjtcclxuICAgICAgICBjW2otLV0gPSBiICUgMTA7XHJcblxyXG4gICAgICAgIC8vIGNhcnJ5XHJcbiAgICAgICAgYiA9IGIgLyAxMCB8IDA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNbal0gPSAoY1tqXSArIGIpICUgMTA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5jcmVtZW50IHJlc3VsdCBleHBvbmVudCBpZiB0aGVyZSBpcyBhIGZpbmFsIGNhcnJ5LCBvdGhlcndpc2UgcmVtb3ZlIGxlYWRpbmcgemVyby5cclxuICAgIGlmIChiKSArK3kuZTtcclxuICAgIGVsc2UgYy5zaGlmdCgpO1xyXG5cclxuICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgIGZvciAoaSA9IGMubGVuZ3RoOyAhY1stLWldOykgYy5wb3AoKTtcclxuICAgIHkuYyA9IGM7XHJcblxyXG4gICAgcmV0dXJuIHk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qXHJcbiAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaW4gZXhwb25lbnRpYWwgbm90YXRpb24gdG8gZHAgZml4ZWQgZGVjaW1hbFxyXG4gICAqIHBsYWNlcyBhbmQgcm91bmRlZCB1c2luZyBCaWcuUk0uXHJcbiAgICpcclxuICAgKiBkcD8ge251bWJlcn0gSW50ZWdlciwgMCB0byBNQVhfRFAgaW5jbHVzaXZlLlxyXG4gICAqL1xyXG4gIFAudG9FeHBvbmVudGlhbCA9IGZ1bmN0aW9uIChkcCkge1xyXG4gICAgcmV0dXJuIHN0cmluZ2lmeSh0aGlzLCAxLCBkcCwgZHApO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGluIG5vcm1hbCBub3RhdGlvbiB0byBkcCBmaXhlZCBkZWNpbWFsXHJcbiAgICogcGxhY2VzIGFuZCByb3VuZGVkIHVzaW5nIEJpZy5STS5cclxuICAgKlxyXG4gICAqIGRwPyB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICpcclxuICAgKiAoLTApLnRvRml4ZWQoMCkgaXMgJzAnLCBidXQgKC0wLjEpLnRvRml4ZWQoMCkgaXMgJy0wJy5cclxuICAgKiAoLTApLnRvRml4ZWQoMSkgaXMgJzAuMCcsIGJ1dCAoLTAuMDEpLnRvRml4ZWQoMSkgaXMgJy0wLjAnLlxyXG4gICAqL1xyXG4gIFAudG9GaXhlZCA9IGZ1bmN0aW9uIChkcCkge1xyXG4gICAgcmV0dXJuIHN0cmluZ2lmeSh0aGlzLCAyLCBkcCwgdGhpcy5lICsgZHApO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHJvdW5kZWQgdG8gc2Qgc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nXHJcbiAgICogQmlnLlJNLiBVc2UgZXhwb25lbnRpYWwgbm90YXRpb24gaWYgc2QgaXMgbGVzcyB0aGFuIHRoZSBudW1iZXIgb2YgZGlnaXRzIG5lY2Vzc2FyeSB0byByZXByZXNlbnRcclxuICAgKiB0aGUgaW50ZWdlciBwYXJ0IG9mIHRoZSB2YWx1ZSBpbiBub3JtYWwgbm90YXRpb24uXHJcbiAgICpcclxuICAgKiBzZCB7bnVtYmVyfSBJbnRlZ2VyLCAxIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICovXHJcbiAgUC50b1ByZWNpc2lvbiA9IGZ1bmN0aW9uIChzZCkge1xyXG4gICAgcmV0dXJuIHN0cmluZ2lmeSh0aGlzLCAzLCBzZCwgc2QgLSAxKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZy5cclxuICAgKiBSZXR1cm4gZXhwb25lbnRpYWwgbm90YXRpb24gaWYgdGhpcyBCaWcgaGFzIGEgcG9zaXRpdmUgZXhwb25lbnQgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuXHJcbiAgICogQmlnLlBFLCBvciBhIG5lZ2F0aXZlIGV4cG9uZW50IGVxdWFsIHRvIG9yIGxlc3MgdGhhbiBCaWcuTkUuXHJcbiAgICogT21pdCB0aGUgc2lnbiBmb3IgbmVnYXRpdmUgemVyby5cclxuICAgKi9cclxuICBQLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHN0cmluZ2lmeSh0aGlzKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZy5cclxuICAgKiBSZXR1cm4gZXhwb25lbnRpYWwgbm90YXRpb24gaWYgdGhpcyBCaWcgaGFzIGEgcG9zaXRpdmUgZXhwb25lbnQgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuXHJcbiAgICogQmlnLlBFLCBvciBhIG5lZ2F0aXZlIGV4cG9uZW50IGVxdWFsIHRvIG9yIGxlc3MgdGhhbiBCaWcuTkUuXHJcbiAgICogSW5jbHVkZSB0aGUgc2lnbiBmb3IgbmVnYXRpdmUgemVyby5cclxuICAgKi9cclxuICBQLnZhbHVlT2YgPSBQLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBzdHJpbmdpZnkodGhpcywgNCk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8vIEV4cG9ydFxyXG5cclxuXHJcbiAgQmlnID0gX0JpZ18oKTtcclxuXHJcbiAgQmlnWydkZWZhdWx0J10gPSBCaWcuQmlnID0gQmlnO1xyXG5cclxuICAvL0FNRC5cclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICBkZWZpbmUoZnVuY3Rpb24gKCkgeyByZXR1cm4gQmlnOyB9KTtcclxuXHJcbiAgLy8gTm9kZSBhbmQgb3RoZXIgQ29tbW9uSlMtbGlrZSBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLlxyXG4gIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gQmlnO1xyXG5cclxuICAvL0Jyb3dzZXIuXHJcbiAgfSBlbHNlIHtcclxuICAgIEdMT0JBTC5CaWcgPSBCaWc7XHJcbiAgfVxyXG59KSh0aGlzKTtcclxuXG4gIH1cbiAgd3JhcC5jYWxsKHdpbmRvdylcbn1cbmNvbnN0IHJlc3VsdCA9IHdpbmRvdy5CaWdcbmlmICghcmVzdWx0KSB0aHJvdyBFcnJvcihcIndyYXBwZXIgZmFpbGVkLCBmaWxlOiBub2RlX21vZHVsZXMvYmlnLmpzL2JpZy5qcyBuYW1lOiBCaWdcIilcbmNvbnNvbGUubG9nKCd3cmFwbGliIG5vZGVfbW9kdWxlcy9iaWcuanMvYmlnLmpzIEJpZycsIHR5cGVvZiB3aW5kb3cuQmlnKVxuZXhwb3J0IGRlZmF1bHQgcmVzdWx0XG4iLCJpbXBvcnQgb3BlcmF0ZSBmcm9tICcuL29wZXJhdGUuanMnO1xuaW1wb3J0IGlzTnVtYmVyIGZyb20gJy4vaXNOdW1iZXIuanMnO1xuXG4vKipcbiAqIEdpdmVuIGEgYnV0dG9uIG5hbWUgYW5kIGEgY2FsY3VsYXRvciBkYXRhIG9iamVjdCwgcmV0dXJuIGFuIHVwZGF0ZWRcbiAqIGNhbGN1bGF0b3IgZGF0YSBvYmplY3QuXG4gKlxuICogQ2FsY3VsYXRvciBkYXRhIG9iamVjdCBjb250YWluczpcbiAqICAgdG90YWw6cyAgICAgIHRoZSBydW5uaW5nIHRvdGFsXG4gKiAgIG5leHQ6U3RyaW5nICAgICAgIHRoZSBuZXh0IG51bWJlciB0byBiZSBvcGVyYXRlZCBvbiB3aXRoIHRoZSB0b3RhbFxuICogICBvcGVyYXRpb246U3RyaW5nICArLCAtLCBldGMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNhbGN1bGF0ZShvYmosIGJ1dHRvbk5hbWUpIHtcbiAgaWYgKGJ1dHRvbk5hbWUgPT09ICdBQycpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdG90YWw6IG51bGwsXG4gICAgICBuZXh0OiBudWxsLFxuICAgICAgb3BlcmF0aW9uOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBpZiAoaXNOdW1iZXIoYnV0dG9uTmFtZSkpIHtcbiAgICBpZiAoYnV0dG9uTmFtZSA9PT0gJzAnICYmIG9iai5uZXh0ID09PSAnMCcpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgLy8gSWYgdGhlcmUgaXMgYW4gb3BlcmF0aW9uLCB1cGRhdGUgbmV4dFxuICAgIGlmIChvYmoub3BlcmF0aW9uKSB7XG4gICAgICBpZiAob2JqLm5leHQpIHtcbiAgICAgICAgcmV0dXJuIHsgbmV4dDogb2JqLm5leHQgKyBidXR0b25OYW1lIH07XG4gICAgICB9XG4gICAgICByZXR1cm4geyBuZXh0OiBidXR0b25OYW1lIH07XG4gICAgfVxuICAgIC8vIElmIHRoZXJlIGlzIG5vIG9wZXJhdGlvbiwgdXBkYXRlIG5leHQgYW5kIGNsZWFyIHRoZSB2YWx1ZVxuICAgIGlmIChvYmoubmV4dCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmV4dDogb2JqLm5leHQgKyBidXR0b25OYW1lLFxuICAgICAgICB0b3RhbDogbnVsbCxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBuZXh0OiBidXR0b25OYW1lLFxuICAgICAgdG90YWw6IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChidXR0b25OYW1lID09PSAnLicpIHtcbiAgICBpZiAob2JqLm5leHQpIHtcbiAgICAgIGlmIChvYmoubmV4dC5pbmNsdWRlcygnLicpKSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7IG5leHQ6IG9iai5uZXh0ICsgJy4nIH07XG4gICAgfVxuICAgIGlmIChvYmoub3BlcmF0aW9uKSB7XG4gICAgICByZXR1cm4geyBuZXh0OiAnMC4nIH07XG4gICAgfVxuICAgIGlmIChvYmoudG90YWwpIHtcbiAgICAgIGlmIChvYmoudG90YWwuaW5jbHVkZXMoJy4nKSkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9XG4gICAgICByZXR1cm4geyB0b3RhbDogb2JqLnRvdGFsICsgJy4nIH07XG4gICAgfVxuICAgIHJldHVybiB7IHRvdGFsOiAnMC4nIH07XG4gIH1cblxuICBpZiAoYnV0dG9uTmFtZSA9PT0gJz0nKSB7XG4gICAgaWYgKG9iai5uZXh0ICYmIG9iai5vcGVyYXRpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRvdGFsOiBvcGVyYXRlKG9iai50b3RhbCwgb2JqLm5leHQsIG9iai5vcGVyYXRpb24pLFxuICAgICAgICBuZXh0OiBudWxsLFxuICAgICAgICBvcGVyYXRpb246IG51bGwsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyAnPScgd2l0aCBubyBvcGVyYXRpb24sIG5vdGhpbmcgdG8gZG9cbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gIH1cblxuICBpZiAoYnV0dG9uTmFtZSA9PT0gJysvLScpIHtcbiAgICBpZiAob2JqLm5leHQpIHtcbiAgICAgIHJldHVybiB7IG5leHQ6ICgtMSAqIHBhcnNlRmxvYXQob2JqLm5leHQpKS50b1N0cmluZygpIH07XG4gICAgfVxuICAgIGlmIChvYmoudG90YWwpIHtcbiAgICAgIHJldHVybiB7IHRvdGFsOiAoLTEgKiBwYXJzZUZsb2F0KG9iai50b3RhbCkpLnRvU3RyaW5nKCkgfTtcbiAgICB9XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgLy8gQnV0dG9uIG11c3QgYmUgYW4gb3BlcmF0aW9uXG5cbiAgLy8gV2hlbiB0aGUgdXNlciBwcmVzc2VzIGFuIG9wZXJhdGlvbiBidXR0b24gd2l0aG91dCBoYXZpbmcgZW50ZXJlZFxuICAvLyBhIG51bWJlciBmaXJzdCwgZG8gbm90aGluZy5cbiAgLy8gaWYgKCFvYmoubmV4dCAmJiAhb2JqLnRvdGFsKSB7XG4gIC8vICAgcmV0dXJuIHt9O1xuICAvLyB9XG5cbiAgLy8gVXNlciBwcmVzc2VkIGFuIG9wZXJhdGlvbiBidXR0b24gYW5kIHRoZXJlIGlzIGFuIGV4aXN0aW5nIG9wZXJhdGlvblxuICBpZiAob2JqLm9wZXJhdGlvbikge1xuICAgIHJldHVybiB7XG4gICAgICB0b3RhbDogb3BlcmF0ZShvYmoudG90YWwsIG9iai5uZXh0LCBvYmoub3BlcmF0aW9uKSxcbiAgICAgIG5leHQ6IG51bGwsXG4gICAgICBvcGVyYXRpb246IGJ1dHRvbk5hbWUsXG4gICAgfTtcbiAgfVxuXG4gIC8vIG5vIG9wZXJhdGlvbiB5ZXQsIGJ1dCB0aGUgdXNlciB0eXBlZCBvbmVcblxuICAvLyBUaGUgdXNlciBoYXNuJ3QgdHlwZWQgYSBudW1iZXIgeWV0LCBqdXN0IHNhdmUgdGhlIG9wZXJhdGlvblxuICBpZiAoIW9iai5uZXh0KSB7XG4gICAgcmV0dXJuIHsgb3BlcmF0aW9uOiBidXR0b25OYW1lIH07XG4gIH1cblxuICAvLyBzYXZlIHRoZSBvcGVyYXRpb24gYW5kIHNoaWZ0ICduZXh0JyBpbnRvICd0b3RhbCdcbiAgcmV0dXJuIHtcbiAgICB0b3RhbDogb2JqLm5leHQsXG4gICAgbmV4dDogbnVsbCxcbiAgICBvcGVyYXRpb246IGJ1dHRvbk5hbWUsXG4gIH07XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpc051bWJlcihpdGVtKSB7XG4gIHJldHVybiAhIWl0ZW0ubWF0Y2goL1swLTldKy8pO1xufVxuIiwiaW1wb3J0IEJpZyBmcm9tICcuLi9saWJzL2JpZy5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG9wZXJhdGUobnVtYmVyT25lLCBudW1iZXJUd28sIG9wZXJhdGlvbikge1xuICBjb25zdCBvbmUgPSBCaWcobnVtYmVyT25lKTtcbiAgY29uc3QgdHdvID0gQmlnKG51bWJlclR3byk7XG4gIGlmIChvcGVyYXRpb24gPT09ICcrJykge1xuICAgIHJldHVybiBvbmUucGx1cyh0d28pLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKG9wZXJhdGlvbiA9PT0gJy0nKSB7XG4gICAgcmV0dXJuIG9uZS5taW51cyh0d28pLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKG9wZXJhdGlvbiA9PT0gJ3gnKSB7XG4gICAgcmV0dXJuIG9uZS50aW1lcyh0d28pLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKG9wZXJhdGlvbiA9PT0gJ8O3Jykge1xuICAgIHJldHVybiBvbmUuZGl2KHR3bykudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAob3BlcmF0aW9uID09PSAnJScpIHtcbiAgICByZXR1cm4gb25lLm1vZCh0d28pLnRvU3RyaW5nKCk7XG4gIH1cbiAgdGhyb3cgRXJyb3IoYFVua25vd24gb3BlcmF0aW9uICcke29wZXJhdGlvbn0nYCk7XG59XG4iLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgZ2V0KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPHN0eWxlPlxuICAgICAgICAgICAgICAgIGNhbGMtYXBwIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47O1xuICAgICAgICAgICAgICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA8L3N0eWxlPmA7XG4gICAgfVxufVxuIiwiaW1wb3J0IENhbGNEaXNwbGF5IGZyb20gJy4uL2NhbGNkaXNwbGF5L2NhbGNkaXNwbGF5LmpzJztcbmltcG9ydCBDYWxjQnV0dG9uUGFuZWwgZnJvbSAnLi4vY2FsY2J1dHRvbnBhbmVsL2NhbGNidXR0b25wYW5lbC5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBnZXQocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiBgPGNhbGMtZGlzcGxheT48L2NhbGMtZGlzcGxheT5cbiAgICAgICAgICAgICAgICA8Y2FsYy1idXR0b25wYW5lbD48L2NhbGMtYnV0dG9ucGFuZWw+YDtcbiAgICB9XG59XG4iLCJpbXBvcnQgQ2FsY0J1dHRvbiBmcm9tICcuLi9jYWxjYnV0dG9uL2NhbGNidXR0b24uanMnO1xuaW1wb3J0IENhbGN1bGF0ZSBmcm9tICcuLi8uLi9sb2dpYy9jYWxjdWxhdGUuanMnO1xuaW1wb3J0IEhUTUwgZnJvbSAnLi9jYWxjYXBwLmh0bWwuanMnO1xuaW1wb3J0IENTUyBmcm9tICcuL2NhbGNhcHAuY3NzLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2FsY0FwcCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHRvdGFsOiBudWxsLFxuICAgICAgICAgICAgbmV4dDogbnVsbCxcbiAgICAgICAgICAgIG9wZXJhdGlvbjogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBgJHtIVE1MLmdldCgpfSAke0NTUy5nZXQoKX1gO1xuXG4gICAgICAgIHRoaXMuZG9tID0ge1xuICAgICAgICAgICAgYnV0dG9ucGFuZWw6IHRoaXMucXVlcnlTZWxlY3RvcignY2FsYy1idXR0b25wYW5lbCcpLFxuICAgICAgICAgICAgZGlzcGxheTogdGhpcy5xdWVyeVNlbGVjdG9yKCdjYWxjLWRpc3BsYXknKVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZG9tLmJ1dHRvbnBhbmVsLmFkZEV2ZW50TGlzdGVuZXIoQ2FsY0J1dHRvbi5DQUxDX0JVVFRPTl9QUkVTUywgZSA9PiB0aGlzLm9uQnV0dG9uUHJlc3MoZSkpO1xuICAgIH1cblxuICAgIG9uQnV0dG9uUHJlc3MoZXZlbnQpIHtcbiAgICAgICAgLy8gUmVhY3QncyBzZXRTdGF0ZSBvdmVybGFpZCByZXR1cm4gdmFsdWVzIG92ZXIgdGhlIG9yaWdpbmFsIC0gYSBzaW1wbGUgZm9yIGxvb3AgY2FuIGRvIHRoZSBzYW1lXG4gICAgICAgIGxldCBjYWxjID0gQ2FsY3VsYXRlKHRoaXMuc3RhdGUsIGV2ZW50LmRldGFpbC5uYW1lKTtcbiAgICAgICAgZm9yIChsZXQgYyBpbiBjYWxjKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlW2NdID0gY2FsY1tjXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRvbS5kaXNwbGF5LnZhbHVlID0gdGhpcy5zdGF0ZS5uZXh0IHx8IHRoaXMuc3RhdGUudG90YWwgfHwgJzAnO1xuICAgIH1cbn1cblxuaWYgKCFjdXN0b21FbGVtZW50cy5nZXQoJ2NhbGMtYXBwJykpIHtcbiAgICBjdXN0b21FbGVtZW50cy5kZWZpbmUoJ2NhbGMtYXBwJywgQ2FsY0FwcCk7XG59XG4iLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgZ2V0KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gYDxzdHlsZT5cbiAgICAgICAgICAgICAgICAgICAgY2FsYy1idXR0b24ge1xuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyNSU7XG4gICAgICAgICAgICAgICAgICAgICAgZmxleDogMSAwIGF1dG87XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbGMtYnV0dG9uLndpZGUge1xuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiA1MCU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbGMtYnV0dG9uIGJ1dHRvbiB7XG4gICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0UwRTBFMDtcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IDA7XG4gICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMCAxcHggMCAwO1xuICAgICAgICAgICAgICAgICAgICAgIGZsZXg6IDEgMCBhdXRvO1xuICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbGMtYnV0dG9uOmxhc3QtY2hpbGQgYnV0dG9uIHtcbiAgICAgICAgICAgICAgICAgICAgICBtYXJnaW4tcmlnaHQ6IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbGMtYnV0dG9uLm9yYW5nZSBidXR0b24ge1xuICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGNTkyM0U7XG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBAbWVkaWEgKG1pbi13aWR0aDogMjAwcHgpIGFuZCAobWluLWhlaWdodDogMjAwcHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYWxjLWJ1dHRvbiBidXR0b24ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAyNXB4O1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgQG1lZGlhIChtaW4td2lkdGg6IDMwMHB4KSBhbmQgKG1pbi1oZWlnaHQ6IDMwMHB4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FsYy1idXR0b24gYnV0dG9uIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMzBweDtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIEBtZWRpYSAobWluLXdpZHRoOiA0MDBweCkgYW5kIChtaW4taGVpZ2h0OiA0MDBweCkge1xuICAgICAgICAgICAgICAgICAgICAgIGNhbGMtYnV0dG9uIGJ1dHRvbiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDM1cHg7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBAbWVkaWEgKG1pbi13aWR0aDogNTAwcHgpIGFuZCAobWluLWhlaWdodDogNTAwcHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYWxjLWJ1dHRvbiBidXR0b24ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiA0MHB4O1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgQG1lZGlhIChtaW4td2lkdGg6IDYwMHB4KSBhbmQgKG1pbi1oZWlnaHQ6IDYwMHB4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FsYy1idXR0b24gYnV0dG9uIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogNjBweDtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIEBtZWRpYSAobWluLXdpZHRoOiA4MDBweCkgYW5kIChtaW4taGVpZ2h0OiA4MDBweCkge1xuICAgICAgICAgICAgICAgICAgICAgIGNhbGMtYnV0dG9uIGJ1dHRvbiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDcwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgPC9zdHlsZT5gXG4gICAgfVxufVxuIiwiZXhwb3J0IGRlZmF1bHQge1xuICAgIGdldChwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIGA8YnV0dG9uPiR7cGFyYW1zLm5hbWV9PC9idXR0b24+YDtcbiAgICB9XG59XG4iLCJpbXBvcnQgSFRNTCBmcm9tICcuL2NhbGNidXR0b24uaHRtbC5qcyc7XG5pbXBvcnQgQ1NTIGZyb20gJy4vY2FsY2J1dHRvbi5jc3MuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDYWxjQnV0dG9uIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgIHN0YXRpYyBnZXQgQ0FMQ19CVVRUT05fUFJFU1MoKSB7IHJldHVybiAnb25DYWxjQnV0dG9uUHJlc3MnOyB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBgICAke0hUTUwuZ2V0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bmFtZTogdGhpcy5nZXRBdHRyaWJ1dGUoJ25hbWUnKX0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtDU1MuZ2V0KCl9YDtcbiAgICAgICAgdGhpcy5xdWVyeVNlbGVjdG9yKCdidXR0b24nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGUgPT4gdGhpcy5vbkJ1dHRvbkNsaWNrKGUpKTtcbiAgICB9XG5cbiAgICBvbkJ1dHRvbkNsaWNrKGUpIHtcbiAgICAgICAgbGV0IGNlID0gbmV3IEN1c3RvbUV2ZW50KENhbGNCdXR0b24uQ0FMQ19CVVRUT05fUFJFU1MsXG4gICAgICAgICAgICB7ICAgYnViYmxlczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjYW5jZWxhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHsgbmFtZTogdGhpcy5nZXRBdHRyaWJ1dGUoJ25hbWUnKSB9fSk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChjZSk7XG4gICAgfVxufVxuXG5pZiAoIWN1c3RvbUVsZW1lbnRzLmdldCgnY2FsYy1idXR0b24nKSkge1xuICAgIGN1c3RvbUVsZW1lbnRzLmRlZmluZSgnY2FsYy1idXR0b24nLCBDYWxjQnV0dG9uKTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICBnZXQocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgPHN0eWxlPlxuICAgICAgICAgICAgICAgICAgICBjYWxjLWJ1dHRvbnBhbmVsIHtcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjODU4Njk0O1xuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICAgICAgICAgICAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAgICAgICAgICAgICAgICAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgICAgICAgICAgICAgICAgICAgZmxleDogMSAwIGF1dG87XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbGMtYnV0dG9ucGFuZWwgPiBkaXYge1xuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDFweDtcbiAgICAgICAgICAgICAgICAgICAgICBmbGV4OiAxIDAgYXV0bztcbiAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgPC9zdHlsZT5gO1xuICAgIH1cbn1cbiIsImltcG9ydCBDYWxjQnV0dG9uIGZyb20gJy4uL2NhbGNidXR0b24vY2FsY2J1dHRvbi5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBnZXQocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiBgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxjYWxjLWJ1dHRvbiBuYW1lPVwiQUNcIj48L2NhbGMtYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGNhbGMtYnV0dG9uIG5hbWU9XCIrLy1cIj48L2NhbGMtYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGNhbGMtYnV0dG9uIG5hbWU9XCIlXCI+PC9jYWxjLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxjYWxjLWJ1dHRvbiBuYW1lPVwiw7dcIiBjbGFzcz1cIm9yYW5nZVwiPjwvY2FsYy1idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxjYWxjLWJ1dHRvbiBuYW1lPVwiN1wiPjwvY2FsYy1idXR0b24+XG4gICAgICAgICAgICAgICAgICA8Y2FsYy1idXR0b24gbmFtZT1cIjhcIj48L2NhbGMtYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGNhbGMtYnV0dG9uIG5hbWU9XCI5XCI+PC9jYWxjLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxjYWxjLWJ1dHRvbiBuYW1lPVwieFwiIGNsYXNzPVwib3JhbmdlXCI+PC9jYWxjLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgPGNhbGMtYnV0dG9uIG5hbWU9XCI0XCI+PC9jYWxjLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxjYWxjLWJ1dHRvbiBuYW1lPVwiNVwiPjwvY2FsYy1idXR0b24+XG4gICAgICAgICAgICAgICAgICA8Y2FsYy1idXR0b24gbmFtZT1cIjZcIj48L2NhbGMtYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGNhbGMtYnV0dG9uIG5hbWU9XCItXCIgY2xhc3M9XCJvcmFuZ2VcIj48L2NhbGMtYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8Y2FsYy1idXR0b24gbmFtZT1cIjFcIj48L2NhbGMtYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGNhbGMtYnV0dG9uIG5hbWU9XCIyXCI+PC9jYWxjLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxjYWxjLWJ1dHRvbiBuYW1lPVwiM1wiPjwvY2FsYy1idXR0b24+XG4gICAgICAgICAgICAgICAgICA8Y2FsYy1idXR0b24gbmFtZT1cIitcIiBjbGFzcz1cIm9yYW5nZVwiPjwvY2FsYy1idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxjYWxjLWJ1dHRvbiBuYW1lPVwiMFwiIGNsYXNzPVwid2lkZVwiPjwvY2FsYy1idXR0b24+XG4gICAgICAgICAgICAgICAgICA8Y2FsYy1idXR0b24gbmFtZT1cIi5cIj48L2NhbGMtYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGNhbGMtYnV0dG9uIG5hbWU9XCI9XCIgY2xhc3M9XCJvcmFuZ2VcIj48L2NhbGMtYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PmA7XG4gICAgfVxufVxuIiwiaW1wb3J0IEhUTUwgZnJvbSAnLi9jYWxjYnV0dG9ucGFuZWwuaHRtbC5qcyc7XG5pbXBvcnQgQ1NTIGZyb20gJy4vY2FsY2J1dHRvbnBhbmVsLmNzcy5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENhbGNCdXR0b25QYW5lbCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBgJHtIVE1MLmdldCgpfSAke0NTUy5nZXQoKX1gO1xuICAgIH1cbn1cblxuaWYgKCFjdXN0b21FbGVtZW50cy5nZXQoJ2NhbGMtYnV0dG9ucGFuZWwnKSkge1xuICAgIGN1c3RvbUVsZW1lbnRzLmRlZmluZSgnY2FsYy1idXR0b25wYW5lbCcsIENhbGNCdXR0b25QYW5lbCk7XG59XG4iLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgZ2V0KHBhcmFtcykge1xuICAgICAgICByZXR1cm4gYDxzdHlsZT5cbiAgICAgICAgICAgICAgICAgICAgY2FsYy1kaXNwbGF5IHtcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjODU4Njk0O1xuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICBmb250LXdlaWdodDogMjAwO1xuICAgICAgICAgICAgICAgICAgICAgIGZsZXg6IDAgMCBhdXRvO1xuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjYWxjLWRpc3BsYXkgPiBkaXYge1xuICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiA4cHggNHB4IDAgNHB4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBAbWVkaWEgKG1pbi13aWR0aDogMjAwcHgpIGFuZCAobWluLWhlaWdodDogMjAwcHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYWxjLWRpc3BsYXkgPiBkaXYge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiA2MHB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjBweCAxNnB4IDAgMTBweDtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIEBtZWRpYSAobWluLXdpZHRoOiAzMDBweCkgYW5kIChtaW4taGVpZ2h0OiAyMDBweCkge1xuICAgICAgICAgICAgICAgICAgICAgIGNhbGMtZGlzcGxheSA+IGRpdiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDcwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMHB4IDIycHggMCAxMHB4O1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgQG1lZGlhIChtaW4td2lkdGg6IDYwMHB4KSBhbmQgKG1pbi1oZWlnaHQ6IDYwMHB4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FsYy1kaXNwbGF5ID4gZGl2IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogODBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHggMzBweCAwIDE1cHg7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBAbWVkaWEgKG1pbi13aWR0aDogODAwcHgpIGFuZCAobWluLWhlaWdodDogODAwcHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYWxjLWRpc3BsYXkgPiBkaXYge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMDBweDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDIwcHggNDBweCAwIDIwcHg7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgPC9zdHlsZT5gO1xuICAgIH1cbn1cbiIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICBnZXQocGFyYW1zKSB7XG4gICAgICAgIHJldHVybiBgPGRpdiBjbGFzcz1cImRpc3BsYXktdGV4dFwiPjA8L2Rpdj5gO1xuICAgIH1cbn1cbiIsImltcG9ydCBIVE1MIGZyb20gJy4vY2FsY2Rpc3BsYXkuaHRtbC5qcyc7XG5pbXBvcnQgQ1NTIGZyb20gJy4vY2FsY2Rpc3BsYXkuY3NzLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2FsY0Rpc3BsYXkgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgc2V0IHZhbHVlKHZhbCkge1xuICAgICAgICB0aGlzLmRvbS5kaXNwbGF5VGV4dC5pbm5lclRleHQgPSB2YWw7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuaW5uZXJIVE1MID0gYCR7SFRNTC5nZXQoKX0gJHtDU1MuZ2V0KCl9YDtcbiAgICAgICAgdGhpcy5kb20gPSB7XG4gICAgICAgICAgICBkaXNwbGF5VGV4dDogdGhpcy5xdWVyeVNlbGVjdG9yKCcuZGlzcGxheS10ZXh0JylcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmlmICghY3VzdG9tRWxlbWVudHMuZ2V0KCdjYWxjLWRpc3BsYXknKSkge1xuICAgIGN1c3RvbUVsZW1lbnRzLmRlZmluZSgnY2FsYy1kaXNwbGF5JywgQ2FsY0Rpc3BsYXkpO1xufVxuIl19
