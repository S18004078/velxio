/**
 * ESP32 DevKit-C Web Component
 *
 * Renders an ESP32 DevKit-C board (38 pins) as a custom HTML element.
 * Pin layout follows the standard ESP32 DevKit-C pinout.
 */

const ESP32_WIDTH  = 280;
const ESP32_HEIGHT = 185;

// ESP32 DevKit-C pinout (left column = GPIO order top-to-bottom, right column = same)
const ESP32_PINS = [
  // Left column (top to bottom)
  { name: 'GPIO36', x: 2,   y: 18  },
  { name: 'GPIO39', x: 2,   y: 29  },
  { name: 'GPIO34', x: 2,   y: 40  },
  { name: 'GPIO35', x: 2,   y: 51  },
  { name: 'GPIO32', x: 2,   y: 62  },
  { name: 'GPIO33', x: 2,   y: 73  },
  { name: 'GPIO25', x: 2,   y: 84  },
  { name: 'GPIO26', x: 2,   y: 95  },
  { name: 'GPIO27', x: 2,   y: 106 },
  { name: 'GPIO14', x: 2,   y: 117 },
  { name: 'GPIO12', x: 2,   y: 128 },
  { name: 'GND',    x: 2,   y: 139 },
  { name: 'GPIO13', x: 2,   y: 150 },
  { name: 'GPIO9',  x: 2,   y: 161 },
  { name: 'GPIO10', x: 2,   y: 172 },
  { name: 'GPIO11', x: 2,   y: 183 },

  // Right column (top to bottom)
  { name: '3V3',    x: 278, y: 18  },
  { name: 'EN',     x: 278, y: 29  },
  { name: 'GPIO36', x: 278, y: 40  },
  { name: 'GPIO39', x: 278, y: 51  },
  { name: 'GPIO34', x: 278, y: 62  },
  { name: 'GPIO35', x: 278, y: 73  },
  { name: 'GPIO32', x: 278, y: 84  },
  { name: 'GPIO33', x: 278, y: 95  },
  { name: 'GPIO25', x: 278, y: 106 },
  { name: 'GPIO26', x: 278, y: 117 },
  { name: 'GPIO27', x: 278, y: 128 },
  { name: 'GND',    x: 278, y: 139 },
  { name: 'GPIO13', x: 278, y: 150 },
  { name: 'GPIO15', x: 278, y: 161 },
  { name: 'GPIO2',  x: 278, y: 172 },
  { name: 'GPIO0',  x: 278, y: 183 },

  // Bottom row
  { name: 'GND',    x: 30,  y: 183 },
  { name: '5V',     x: 50,  y: 183 },
  { name: 'GPIO23', x: 70,  y: 183 },
  { name: 'GPIO22', x: 90,  y: 183 },
  { name: 'TX',     x: 110, y: 183 },
  { name: 'RX',     x: 130, y: 183 },
  { name: 'GPIO21', x: 150, y: 183 },
  { name: 'GND',    x: 170, y: 183 },
  { name: 'GPIO19', x: 190, y: 183 },
  { name: 'GPIO18', x: 210, y: 183 },
  { name: 'GPIO5',  x: 230, y: 183 },
  { name: 'GPIO17', x: 250, y: 183 },
  { name: 'GPIO16', x: 270, y: 183 },
  { name: 'GPIO4',  x: 20,  y: 183 },
];

class Esp32Element extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  get pinInfo() {
    return ESP32_PINS;
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; }
        svg { display: block; }
      </style>
      <svg
        width="${ESP32_WIDTH}"
        height="${ESP32_HEIGHT}"
        viewBox="0 0 ${ESP32_WIDTH} ${ESP32_HEIGHT}"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- PCB body -->
        <rect x="10" y="5" width="${ESP32_WIDTH - 20}" height="${ESP32_HEIGHT - 15}"
              rx="4" fill="#1a6b3e" stroke="#0d4a2a" stroke-width="1.5"/>

        <!-- USB connector -->
        <rect x="115" y="0" width="50" height="12" rx="2" fill="#888"/>
        <rect x="119" y="2" width="42" height="8" rx="1" fill="#555"/>

        <!-- ESP32 chip -->
        <rect x="95" y="55" width="90" height="60" rx="4" fill="#222" stroke="#444" stroke-width="1"/>
        <text x="140" y="86" text-anchor="middle" fill="#aaa" font-size="9" font-family="monospace">ESP32</text>
        <text x="140" y="97" text-anchor="middle" fill="#666" font-size="7" font-family="monospace">WROOM-32</text>

        <!-- WiFi/BT chip -->
        <rect x="100" y="20" width="80" height="30" rx="2" fill="#2a2a2a" stroke="#555" stroke-width="0.5"/>
        <text x="140" y="38" text-anchor="middle" fill="#888" font-size="7" font-family="monospace">WiFi+BT</text>

        <!-- LED indicators -->
        <circle cx="60" cy="25" r="4" fill="#f00" opacity="0.8"/>
        <text x="60" y="40" text-anchor="middle" fill="#aaa" font-size="6" font-family="monospace">PWR</text>
        <circle cx="78" cy="25" r="4" fill="#00f" opacity="0.6"/>
        <text x="78" y="40" text-anchor="middle" fill="#aaa" font-size="6" font-family="monospace">BT</text>

        <!-- BOOT and EN buttons -->
        <rect x="210" y="145" width="20" height="8" rx="2" fill="#444"/>
        <text x="220" y="162" text-anchor="middle" fill="#aaa" font-size="5" font-family="monospace">BOOT</text>
        <rect x="210" y="125" width="20" height="8" rx="2" fill="#444"/>
        <text x="220" y="122" text-anchor="middle" fill="#aaa" font-size="5" font-family="monospace">EN</text>

        <!-- Left header pins -->
        ${ESP32_PINS.filter(p => p.x < 10).map((p, i) => `
          <rect x="3" y="${p.y - 3}" width="8" height="6" fill="#c8a000" rx="0.5"/>
        `).join('')}

        <!-- Right header pins -->
        ${ESP32_PINS.filter(p => p.x > 270).map((p) => `
          <rect x="${ESP32_WIDTH - 11}" y="${p.y - 3}" width="8" height="6" fill="#c8a000" rx="0.5"/>
        `).join('')}

        <!-- Board label -->
        <text x="140" y="${ESP32_HEIGHT - 4}" text-anchor="middle" fill="#5a9" font-size="7" font-family="monospace">
          ESP32 DevKit-C
        </text>
      </svg>
    `;
  }
}

if (!customElements.get('wokwi-esp32')) {
  customElements.define('wokwi-esp32', Esp32Element);
}
