// Interactive geometric views of each problem. Drafted for this demo, not from the book.
(function () {
  const R = String.raw;
  const f = (n) => n.toFixed(2);

  function label(x, y, text, cls, anchor) {
    return `<text x="${x}" y="${y}" class="g-text ${cls || ""}" text-anchor="${anchor || "middle"}">${text}</text>`;
  }

  function line(x1, y1, x2, y2, cls) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"></line>`;
  }

  function svg(w, h, body, title) {
    return `<svg class="geo" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">${body}</svg>`;
  }

  // Shared by the circle views: a,b axes with the circle a²+b²=5.
  function circlePlane(cx, cy, k) {
    return line(cx - 2.9 * k, cy, cx + 2.9 * k, cy, "g-axis") + line(cx, cy - 2.9 * k, cx, cy + 2.9 * k, "g-axis") +
      `<circle cx="${cx}" cy="${cy}" r="${Math.sqrt(5) * k}" class="g-main"></circle>` +
      label(cx + 2.9 * k - 2, cy - 7, "a", "", "end") + label(cx + 8, cy - 2.9 * k + 14, "b", "", "start");
  }

  // A big square with a small corner removed, beside the same area as a rectangle.
  function gnomon(s, u, k) {
    const top = 28, left = 8, big = s * k, small = u * k;
    const rx = left + big + 18, rw = (s + u) * k, rh = Math.max((s - u) * k, 2.5);
    return `<rect x="${left}" y="${top}" width="${big}" height="${big}" class="g-fill"></rect>` +
      `<rect x="${left}" y="${top + big - small}" width="${small}" height="${small}" class="g-hole"></rect>` +
      `<rect x="${rx}" y="${top}" width="${rw}" height="${rh}" class="g-fill"></rect>` +
      label(left, top - 6, "L 形", "", "start") + label(rx, top - 6, "剪开拼成长方形", "", "start");
  }

  window.LENSES = {
    p1: [
      {
        title: "直线碰圆", path: "换元 + 判别式",
        caption: R`$a^2+b^2=5$ 是一个圆，$2a+b=M$ 是一条直线。$M$ 越大，直线越往外移。判别式 $\Delta\ge 0$ 的意思就是：直线还碰得到圆。`,
        params: { M: { min: 0, max: 6.5, step: 0.1, value: 2, name: "M" } },
        draw({ M }) {
          const cx = 200, cy = 160, k = 50, X = (a) => cx + k * a, Y = (b) => cy - k * b;
          const delta = 100 - 4 * M * M;
          let dots = "";
          if (delta >= -1e-9) {
            const root = Math.sqrt(Math.max(delta, 0));
            [1, -1].forEach((sign) => {
              const a = (4 * M + sign * root) / 10;
              dots += `<circle cx="${X(a)}" cy="${Y(M - 2 * a)}" r="6" class="g-dot"></circle>`;
            });
          }
          const hit = Math.abs(M - 5) < 1e-6;
          const count = hit ? "1 个，正好相切" : delta > 0 ? "2 个" : "0 个，碰不到了";
          return {
            svg: svg(400, 320, circlePlane(cx, cy, k) + line(X(-4), Y(M + 8), X(4), Y(M - 8), "g-accent") + dots +
              (hit ? label(X(2) + 12, Y(1) - 8, "(2, 1)", "g-strong", "start") : ""), "圆与直线"),
            readout: R`$\Delta=${f(delta)}$ · 交点：${count}`,
            hit,
          };
        },
      },
      {
        title: "直角三角形", path: "对偶式",
        caption: R`$(2a+b)^2+(2b-a)^2=25$ 就是勾股定理：斜边永远是 $5$。直角边 $|2a+b|$ 再长，也长不过斜边。`,
        params: { deg: { min: 0, max: 359, step: 1, value: 110, name: "点 P 绕圆的角度" } },
        draw({ deg }) {
          const t = (deg * Math.PI) / 180, a = Math.sqrt(5) * Math.cos(t), b = Math.sqrt(5) * Math.sin(t);
          const u = 2 * a + b, v = 2 * b - a, cx = 104, cy = 150, k = 34, ox = 215, oy = 262, q = 40;
          const tx = ox + Math.abs(v) * q, ty = oy - Math.abs(u) * q;
          const hit = Math.abs(u) > 4.995 && u > 0;
          const body = circlePlane(cx, cy, k) +
            `<circle cx="${cx + k * a}" cy="${cy - k * b}" r="7" class="g-dot"></circle>` + label(cx + k * a, cy - k * b - 12, "P", "g-strong") +
            `<polygon points="${ox},${oy} ${tx},${oy} ${ox},${ty}" class="g-fill"></polygon>` +
            line(ox, oy, ox, ty, "g-thick") + label(ox, oy + 20, "粗边 |2a+b|，斜边 5", "", "start");
          return {
            svg: svg(420, 300, body, "圆上的点与直角三角形"),
            readout: R`$2a+b=${f(u)}$，$2b-a=${f(v)}$，平方和 $=${f(u * u + v * v)}$`,
            hit,
          };
        },
      },
      {
        title: "投影长度", path: "柯西不等式",
        caption: R`$2a+b$ 是向量 $(a,b)$ 与 $(2,1)$ 的点积。两个向量长度都是 $\sqrt5$，方向完全一致时点积最大，这正是柯西不等式取等号的情形。`,
        params: { deg: { min: 0, max: 359, step: 1, value: 110, name: "点 P 绕圆的角度" } },
        draw({ deg }) {
          const t = (deg * Math.PI) / 180, a = Math.sqrt(5) * Math.cos(t), b = Math.sqrt(5) * Math.sin(t);
          const cx = 200, cy = 160, k = 50, X = (p) => cx + k * p, Y = (p) => cy - k * p;
          const dot = 2 * a + b, proj = dot / 5, fx = 2 * proj, fy = proj;
          const hit = dot > 4.995;
          const body = circlePlane(cx, cy, k) + line(X(-2.6), Y(-1.3), X(2.6), Y(1.3), "g-axis") +
            line(cx, cy, X(2), Y(1), "g-main-line") + line(cx, cy, X(a), Y(b), "g-accent") +
            line(X(a), Y(b), X(fx), Y(fy), "g-dash") + line(cx, cy, X(fx), Y(fy), "g-thick") +
            `<circle cx="${X(a)}" cy="${Y(b)}" r="7" class="g-dot"></circle>` + label(X(a), Y(b) - 12, "P", "g-strong") +
            label(X(2) + 8, Y(1) - 6, "(2, 1)", "", "start");
          return {
            svg: svg(400, 320, body, "向量投影"),
            readout: R`$2a+b=${f(dot)}$（最大可能为 $\sqrt5\times\sqrt5=5$）`,
            hit,
          };
        },
      },
    ],
    p2: [
      {
        title: "L 形变长方形", path: "两次换元，同时引入",
        caption: R`$(2a+1)^2-(2b)^2$ 是大正方形去掉小正方形后的 L 形。把它剪开拼成长方形，面积不变。$61$ 是质数，所以长方形只能是 $61\times 1$，一根细长条。`,
        params: {
          s: { min: 3, max: 41, step: 2, value: 21, name: "大正方形边长 2a+1" },
          u: { min: 2, max: 40, step: 2, value: 14, name: "小正方形边长 2b" },
        },
        draw({ s, u }) {
          const small = Math.min(u, s - 1), area = s * s - small * small;
          const hit = area === 61;
          return {
            svg: svg(420, 180, gnomon(s, small, 3), "L 形与长方形"),
            readout: R`面积 $=${s}^2-${small}^2=${s + small}\times${s - small}=${area}$` + (hit ? "，正是 $61$" : "，目标是 $61$"),
            hit,
          };
        },
      },
      {
        title: "方格凑平方", path: "两次换元，逐层推进",
        caption: R`$k^2+k-15=t^2$ 的意思是：$k\times(k+1)$ 的长方形去掉 $15$ 个小格后，面积要恰好是一个完全平方数。`,
        params: { k: { min: 4, max: 25, step: 1, value: 8, name: "k = √(x+15)" } },
        draw({ k }) {
          const value = k * k + k - 15, root = Math.round(Math.sqrt(value)), hit = root * root === value;
          const c = 6.5, left = 16, top = 12;
          let cut = "";
          for (let i = 0; i < 15; i++) {
            cut += `<rect x="${left + (i % 5) * c}" y="${top + Math.floor(i / 5) * c}" width="${c}" height="${c}" class="g-cut"></rect>`;
          }
          const body = `<rect x="${left}" y="${top}" width="${(k + 1) * c}" height="${k * c}" class="g-fill"></rect>` + cut +
            label(left + (k + 1) * c + 10, top + 14, `${k} × ${k + 1}`, "", "start") +
            label(left + (k + 1) * c + 10, top + 38, "减去 15 格", "", "start");
          return {
            svg: svg(420, 190, body, "长方形方格"),
            readout: R`$k^2+k-15=${value}$` + (hit ? R` $=${root}^2$，此时 $x=k^2-15=${k * k - 15}$` : "，不是完全平方数"),
            hit,
          };
        },
      },
    ],
    p3: [
      {
        title: "两个直角三角形", path: "双换元 / 三换元",
        caption: R`$\sqrt{m^2+21}$ 和 $\sqrt{m^2+5}$ 都是斜边，两个直角三角形共用直角边 $m$。而 $\sqrt{m^2-1}$ 是第三个三角形的直角边。斜边之和随 $m$ 变大，所以 $m\ge 0$ 时只有一个位置能让和等于 $8$，$m$ 取负数时情况对称。`,
        params: { m: { min: 0, max: 4, step: 0.1, value: 1, name: "共用直角边 m" } },
        draw({ m }) {
          const a = Math.sqrt(m * m + 21), b = Math.sqrt(m * m + 5), k = 38, cx = 190, base = 200;
          const hit = Math.abs(m - 2) < 1e-6, topY = base - m * k;
          const lx = cx - Math.sqrt(21) * k, rx = cx + Math.sqrt(5) * k;
          let third = "";
          if (m >= 1) {
            const h = Math.sqrt(m * m - 1) * k;
            third = `<polygon points="310,${base} ${310 + k},${base} 310,${base - h}" class="g-fill"></polygon>` +
              label(304, base - h / 2, hit ? "√3" : "", "g-strong", "end") + label(310 + k / 2, base + 18, "1");
          }
          const body = `<polygon points="${lx},${base} ${cx},${base} ${cx},${topY}" class="g-fill"></polygon>` +
            `<polygon points="${rx},${base} ${cx},${base} ${cx},${topY}" class="g-fill"></polygon>` +
            line(lx, base, cx, topY, "g-accent") + line(rx, base, cx, topY, "g-accent") + line(cx, base, cx, topY, "g-thick") +
            label((lx + cx) / 2, base + 18, "√21") + label((rx + cx) / 2, base + 18, "√5") + third;
          return {
            svg: svg(380, 225, body, "共用一条直角边的直角三角形"),
            readout: R`斜边 $a=${f(a)}$，$b=${f(b)}$，$a+b=${f(a + b)}$（目标 $8$），$a^2-b^2=${f(a * a - b * b)}$ 始终不变`,
            hit,
          };
        },
      },
      {
        title: "面积不变的 L 形", path: "整体换元",
        caption: R`不管 $m$ 怎么变，L 形面积 $a^2-b^2$ 始终是 $16$。拼成长方形后，长是 $a+b$。当长等于 $8$，宽 $a-b$ 就只能是 $2$。`,
        params: { m: { min: 0, max: 4, step: 0.1, value: 1, name: "m" } },
        draw({ m }) {
          const a = Math.sqrt(m * m + 21), b = Math.sqrt(m * m + 5), hit = Math.abs(m - 2) < 1e-6;
          return {
            svg: svg(420, 180, gnomon(a, b, 22), "L 形与长方形"),
            readout: R`长方形：$${f(a + b)}\times${f(a - b)}=${f((a + b) * (a - b))}$`,
            hit,
          };
        },
      },
      {
        title: "数轴上的中点", path: "中值换元",
        caption: R`$m^2+5$ 和 $m^2+21$ 在数轴上相距 $16$，它们的中点是 $k=m^2+13$。两个数总是 $k-8$ 和 $k+8$，只用一个字母就够了。`,
        params: { k: { min: 8, max: 30, step: 1, value: 12, name: "中点 k" } },
        draw({ k }) {
          const lo = Math.sqrt(k - 8), hi = Math.sqrt(k + 8), hit = k === 17, q = 9, base = 72, X = (n) => 16 + n * q;
          const body = line(X(0), base, X(40), base, "g-axis") +
            [[k - 8, "k−8"], [k, "k"], [k + 8, "k+8"]].map(([n, t]) =>
              `<circle cx="${X(n)}" cy="${base}" r="6" class="g-dot"></circle>` + label(X(n), base - 14, t) + label(X(n), base + 24, n)).join("") +
            `<rect x="16" y="130" width="${lo * 30}" height="24" class="g-fill"></rect>` +
            `<rect x="${16 + lo * 30}" y="130" width="${hi * 30}" height="24" class="g-cut"></rect>` +
            line(16 + 8 * 30, 120, 16 + 8 * 30, 164, "g-accent") + label(16 + 8 * 30, 114, "8");
          return {
            svg: svg(390, 175, body, "数轴上的中点"),
            readout: R`$\sqrt{k-8}+\sqrt{k+8}=${f(lo)}+${f(hi)}=${f(lo + hi)}$（目标 $8$）`,
            hit,
          };
        },
      },
    ],
  };
})();
