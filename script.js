// Hexagon grid configuration
// Each hex has axial coordinates (q, r) for positioning on a hex grid
const hexagonData = [
    { q: 0, r: 0, url: 'https://claude.ai', altUrl: 'https://aistudio.google.com', logo: 'logos/claude.svg', alt: 'Claude' },
    { q: 0, r: 1, url: 'https://github.com', altUrl: 'https://github.com', logo: 'logos/github.svg', alt: 'Github' },
    { q: 1, r: 0, type: 'weather', url: 'https://weather.com', logo: 'logos/clouds.svg', alt: 'Weather' },
    { q: 1, r: 1, url: 'https://wikipedia.org', logo: 'logos/wikipedia.svg', alt: 'Wikipedia' },
    { q: -1, r: 2, url: 'https://twitter.com', logo: 'logos/twitter.svg', alt: 'Twitter' },
    { q: -1, r: 3, url: 'https://mail.google.com', logo: 'logos/gmail.svg', alt: 'Gmail' },
    { q: -2, r: 4, url: 'https://aistudio.google.com', altUrl: 'https://claude.ai', logo: 'logos/gemini.svg', alt: 'Gemini' },
    { q: 0, r: 3, url: 'https://drive.google.com', logo: 'logos/drive.svg', alt: 'Drive' },
    { q: 0, r: 4, url: 'https://youtube.com', logo: 'logos/youtube.svg', alt: 'Youtube' }

];

// Hex grid parameters - calculated from CSS
// These will be initialized after DOM loads
let HEX_SIZE, HEX_WIDTH, HEX_HEIGHT;

// Weather configuration
const WEATHER_LAT = 42.3876;
const WEATHER_LON = -71.0995;
const WEATHER_CACHE_KEY = 'weather_data';
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const USER_AGENT = '(KamonStartPage, contact@example.com)'; // Update with your email

// Map weather conditions to icons
function getWeatherIcon(shortForecast) {
    const condition = shortForecast.toLowerCase();

    if (condition.includes('sunny') || condition.includes('clear')) {
        return 'logos/sun.svg';
    } else if (condition.includes('rain') || condition.includes('showers')) {
        return 'logos/rain.svg';
    } else if (condition.includes('thunder') || condition.includes('storm')) {
        return 'logos/storm.svg';
    } else if (condition.includes('snow') || condition.includes('flurries')) {
        return 'logos/snow.svg';
    } else if (condition.includes('fog') || condition.includes('mist')) {
        return 'logos/fog.svg';
    } else if (condition.includes('cloud') || condition.includes('overcast')) {
        return 'logos/clouds.svg';
    }

    return 'logos/clouds.svg'; // Default fallback
}

// Fetch current weather from weather.gov
async function fetchWeather() {
    // Check cache first
    const cached = localStorage.getItem(WEATHER_CACHE_KEY);
    if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < WEATHER_CACHE_DURATION) {
            return data.weather;
        }
    }

    try {
        // Step 1: Get forecast URLs for location
        const pointsUrl = `https://api.weather.gov/points/${WEATHER_LAT},${WEATHER_LON}`;
        const pointsResponse = await fetch(pointsUrl, {
            headers: { 'User-Agent': USER_AGENT }
        });
        const pointsData = await pointsResponse.json();

        // Step 2: Get current forecast
        const forecastUrl = pointsData.properties.forecast;
        const forecastResponse = await fetch(forecastUrl, {
            headers: { 'User-Agent': USER_AGENT }
        });
        const forecastData = await forecastResponse.json();

        // Get current period (first entry)
        const current = forecastData.properties.periods[0];

        const weather = {
            condition: current.shortForecast,
            icon: getWeatherIcon(current.shortForecast),
            temp: current.temperature,
            tempUnit: current.temperatureUnit
        };

        // Cache result
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
            weather,
            timestamp: Date.now()
        }));

        return weather;
    } catch (error) {
        console.error('Weather fetch failed:', error);

        // Return cached data if available, even if stale
        const cached = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached).weather;
        }

        // Ultimate fallback
        return {
            condition: 'Unknown',
            icon: 'logos/clouds.svg',
            temp: null
        };
    }
}

// Grid offset to shift all hexagons (adjust to position grid on page)
const GRID_OFFSET = { x: 100, y: 200 };

// Grid occupancy tracking - maps "q,r" -> hexagon element
const gridOccupancy = new Map();

// Drag state
let draggedHex = null;
let dragOffset = { x: 0, y: 0 };
let originalPosition = null;
let gridOverlay = null;
let targetHighlight = null;

// Convert axial hex coordinates (q, r) to pixel coordinates
function hexToPixel(q, r) {
    const x = HEX_WIDTH * (q + r / 2) + GRID_OFFSET.x;
    const y = HEX_HEIGHT * 3/4 * r + GRID_OFFSET.y;
    return { x, y };
}

// Check if a hex position is valid (not too close to viewport edges)
function isHexPositionValid(q, r) {
    const pos = hexToPixel(q, r);
    const container = document.querySelector('.hexagon-container');
    const rect = container.getBoundingClientRect();

    // Use HEX_SIZE as the minimum distance from edge (side length of hexagon)
    const margin = HEX_SIZE;

    // Check all four edges
    if (pos.x < margin) return false; // Too close to left
    if (pos.x > rect.width - margin) return false; // Too close to right
    if (pos.y < margin) return false; // Too close to top
    if (pos.y > rect.height - margin) return false; // Too close to bottom

    return true;
}

// Convert pixel coordinates to hex coordinates
function pixelToHex(x, y) {
    // Remove grid offset
    x -= GRID_OFFSET.x;
    y -= GRID_OFFSET.y;

    // Convert pixel to fractional hex coordinates
    const q = (x * Math.sqrt(3)/3 - y / 3) / HEX_SIZE;
    const r = y * 2/3 / HEX_SIZE;

    // Round to nearest integer hex coordinates
    return roundHex(q, r);
}

// Round fractional hex coordinates to nearest integer hex
function roundHex(q, r) {
    // Axial to cube coordinates
    let x = q;
    let z = r;
    let y = -x - z;

    // Round to integers
    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);

    // Fix rounding errors (cube coordinates must sum to 0)
    const x_diff = Math.abs(rx - x);
    const y_diff = Math.abs(ry - y);
    const z_diff = Math.abs(rz - z);

    if (x_diff > y_diff && x_diff > z_diff) {
        rx = -ry - rz;
    } else if (y_diff > z_diff) {
        ry = -rx - rz;
    } else {
        rz = -rx - ry;
    }

    return { q: rx, r: rz };
}

// Update grid occupancy map
function updateGridOccupancy() {
    gridOccupancy.clear();
    document.querySelectorAll('.hexagon').forEach(hex => {
        const q = parseInt(hex.getAttribute('data-q'));
        const r = parseInt(hex.getAttribute('data-r'));
        gridOccupancy.set(`${q},${r}`, hex);
    });
}

// Move hexagon to new grid position
function moveHexagonToGrid(hexagon, q, r) {
    // Update data attributes
    hexagon.setAttribute('data-q', q);
    hexagon.setAttribute('data-r', r);

    // Animate to grid position (centered)
    const pos = hexToPixel(q, r);
    const kamonSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kamon-size'));
    hexagon.style.left = `${pos.x - kamonSize / 2}px`;
    hexagon.style.top = `${pos.y - kamonSize / 2}px`;

    updateGridOccupancy();
}

// Swap positions of two hexagons
function swapHexagons(hex1, hex2) {
    const q1 = parseInt(hex1.getAttribute('data-q'));
    const r1 = parseInt(hex1.getAttribute('data-r'));
    const q2 = parseInt(hex2.getAttribute('data-q'));
    const r2 = parseInt(hex2.getAttribute('data-r'));

    // Swap their grid positions
    moveHexagonToGrid(hex1, q2, r2);
    moveHexagonToGrid(hex2, q1, r1);
}

// Show grid overlay during drag
function showGridOverlay() {
    if (gridOverlay) return; // Already showing

    const container = document.querySelector('.hexagon-container');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = 0;
    svg.style.left = 0;
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.opacity = '0.3';
    svg.style.zIndex = '500';
    svg.id = 'grid-overlay';

    // Draw grid points for visible area (only valid positions)
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let q = -10; q < 20; q++) {
        for (let r = -10; r < 20; r++) {
            const pos = hexToPixel(q, r);
            if (pos.x > -200 && pos.x < width && pos.y > -200 && pos.y < height) {
                // Only show valid positions
                if (isHexPositionValid(q, r)) {
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', pos.x);
                    circle.setAttribute('cy', pos.y);
                    circle.setAttribute('r', 3);
                    circle.setAttribute('fill', '#F0D050');
                    svg.appendChild(circle);
                }
            }
        }
    }

    container.appendChild(svg);
    gridOverlay = svg;
}

// Hide grid overlay
function hideGridOverlay() {
    if (gridOverlay) {
        gridOverlay.remove();
        gridOverlay = null;
    }
}

// Show/update target hex highlight
function updateTargetHighlight(q, r) {
    const container = document.querySelector('.hexagon-container');

    // Remove old highlight
    if (targetHighlight) {
        targetHighlight.remove();
        targetHighlight = null;
    }

    // Check if position is valid - if not, don't show any highlight
    if (!isHexPositionValid(q, r)) {
        return;
    }

    // Create hexagon points for highlight
    const cx = 50, cy = 50;
    const sin60 = 0.866025;
    const cos60 = 0.5;
    const baseRadius = 43;

    const hexPoints = (scale) => {
        const rad = baseRadius * scale;
        return [
            [cx, cy - rad],
            [cx + rad * sin60, cy - rad * cos60],
            [cx + rad * sin60, cy + rad * cos60],
            [cx, cy + rad],
            [cx - rad * sin60, cy + rad * cos60],
            [cx - rad * sin60, cy - rad * cos60]
        ].map(p => p.join(',')).join(' ');
    };

    // Create highlight SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.style.position = 'absolute';
    svg.style.width = `${getComputedStyle(document.documentElement).getPropertyValue('--kamon-size')}`;
    svg.style.height = `${getComputedStyle(document.documentElement).getPropertyValue('--kamon-size')}`;
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '999';

    const pos = hexToPixel(q, r);
    const kamonSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kamon-size'));
    svg.style.left = `${pos.x - kamonSize / 2}px`;
    svg.style.top = `${pos.y - kamonSize / 2}px`;

    // Create glowing hexagon outline
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', hexPoints(1.05));
    polygon.setAttribute('fill', 'none');
    polygon.setAttribute('stroke', '#FFE066');
    polygon.setAttribute('stroke-width', '2');
    polygon.setAttribute('opacity', '0.8');

    svg.appendChild(polygon);
    container.appendChild(svg);
    targetHighlight = svg;
}

// Hide target highlight
function hideTargetHighlight() {
    if (targetHighlight) {
        targetHighlight.remove();
        targetHighlight = null;
    }
}

// Make a hexagon draggable
function makeHexagonDraggable(hexagon) {
    hexagon.addEventListener('mousedown', (e) => {
        // Prevent navigation on drag
        e.preventDefault();

        draggedHex = hexagon;

        // Store original grid position
        originalPosition = {
            q: parseInt(hexagon.getAttribute('data-q')),
            r: parseInt(hexagon.getAttribute('data-r'))
        };

        // Calculate offset from mouse to hex position
        const rect = hexagon.getBoundingClientRect();
        const container = hexagon.parentElement.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        hexagon.style.zIndex = 1000;
        hexagon.classList.add('dragging');

        // Show grid overlay when drag starts
        showGridOverlay();
    });
}

// Document-level mousemove handler for dragging
document.addEventListener('mousemove', (e) => {
    if (!draggedHex) return;

    const container = document.querySelector('.hexagon-container');
    const rect = container.getBoundingClientRect();

    // Update position to follow mouse
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    draggedHex.style.left = `${x}px`;
    draggedHex.style.top = `${y}px`;

    // Calculate target hex position and show highlight
    const hexRect = draggedHex.getBoundingClientRect();
    const centerX = hexRect.left + hexRect.width / 2 - rect.left;
    const centerY = hexRect.top + hexRect.height / 2 - rect.top;
    const targetHex = pixelToHex(centerX, centerY);

    updateTargetHighlight(targetHex.q, targetHex.r);
});

// Document-level mouseup handler for drop
document.addEventListener('mouseup', (e) => {
    if (!draggedHex) return;

    const container = document.querySelector('.hexagon-container');
    const rect = container.getBoundingClientRect();

    // Get center of dragged hex relative to container
    const hexRect = draggedHex.getBoundingClientRect();
    const centerX = hexRect.left + hexRect.width / 2 - rect.left;
    const centerY = hexRect.top + hexRect.height / 2 - rect.top;

    // Convert to hex coordinates and snap
    const targetHex = pixelToHex(centerX, centerY);
    const targetKey = `${targetHex.q},${targetHex.r}`;

    // Check if target position is valid
    if (!isHexPositionValid(targetHex.q, targetHex.r)) {
        // Invalid position - snap back to original
        moveHexagonToGrid(draggedHex, originalPosition.q, originalPosition.r);
    } else {
        // Check if position is occupied
        const occupyingHex = gridOccupancy.get(targetKey);

        if (occupyingHex && occupyingHex !== draggedHex) {
            // Swap positions
            swapHexagons(draggedHex, occupyingHex);
        } else {
            // Just move to new position
            moveHexagonToGrid(draggedHex, targetHex.q, targetHex.r);
        }
    }

    draggedHex.style.zIndex = '';
    draggedHex.classList.remove('dragging');
    draggedHex = null;

    // Hide grid overlay and target highlight when drag ends
    hideGridOverlay();
    hideTargetHighlight();
});

// Initialize hex grid parameters from CSS
function initHexGridFromCSS() {
    const kamonSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kamon-size'));
    // HEX_SIZE is the radius from center to vertex
    // The SVG viewBox is 100x100 with baseRadius 43, so radius = (43/100) * kamonSize
    HEX_SIZE = (43 / 100) * kamonSize;
    HEX_WIDTH = HEX_SIZE * Math.sqrt(3);
    HEX_HEIGHT = HEX_SIZE * 2;
}

// Kamon SVG structure - edit this to change all hexagons
// Three thin gold borders with colored regions between them
function createKamonSVG() {
    const cx = 50, cy = 50;
    const sin60 = 0.866025;
    const cos60 = 0.5;
    const baseRadius = 43;

    // Helper function to create hexagon points
    const hexPoints = (scale) => {
        const r = baseRadius * scale;
        return [
            [cx, cy - r],                           // top
            [cx + r * sin60, cy - r * cos60],      // upper right
            [cx + r * sin60, cy + r * cos60],      // lower right
            [cx, cy + r],                           // bottom
            [cx - r * sin60, cy + r * cos60],      // lower left
            [cx - r * sin60, cy - r * cos60]       // upper left
        ].map(p => p.join(',')).join(' ');
    };

    return `
        <svg viewBox="0 0 100 100" class="hexagon-shape">
            <!-- Outermost border (1.0) with outer colored region -->
            <polygon points="${hexPoints(1.0)}" class="outer-region" />
            <!-- Second border (0.94) with middle colored region -->
            <polygon points="${hexPoints(0.94)}" class="middle-region" />
            <!-- Third border (0.76) with dark center for favicon -->
            <polygon points="${hexPoints(0.76)}" class="inner-region" />
        </svg>
    `;
}

// Generate a hexagon element positioned on the hex grid
function createHexagon(data) {
    const hexDiv = document.createElement('div');
    hexDiv.className = 'hexagon';
    hexDiv.setAttribute('data-url', data.url);
    hexDiv.setAttribute('data-q', data.q);
    hexDiv.setAttribute('data-r', data.r);
    hexDiv.setAttribute('data-site', data.alt.toLowerCase());
    if (data.altUrl) {
        hexDiv.setAttribute('data-alt-url', data.altUrl);
    }

    // Calculate pixel position from hex grid coordinates (centered)
    const pos = hexToPixel(data.q, data.r);
    const kamonSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kamon-size'));
    hexDiv.style.left = `${pos.x - kamonSize / 2}px`;
    hexDiv.style.top = `${pos.y - kamonSize / 2}px`;

    hexDiv.innerHTML = `
        ${createKamonSVG()}
        <img src="${data.logo}" alt="${data.alt}" class="favicon">
    `;

    return hexDiv;
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize hex grid parameters from CSS
    initHexGridFromCSS();

    const container = document.querySelector('.hexagon-container');

    // Generate all hexagons
    hexagonData.forEach(data => {
        const hexagon = createHexagon(data);
        container.appendChild(hexagon);

        // Make hexagon draggable
        makeHexagonDraggable(hexagon);

        // Add click handler (only navigate if not dragging)
        let mouseDownPos = null;
        hexagon.addEventListener('mousedown', (e) => {
            mouseDownPos = { x: e.clientX, y: e.clientY };
        });
        hexagon.addEventListener('click', function(e) {
            // Only navigate if mouse didn't move much (not a drag)
            if (mouseDownPos) {
                const distance = Math.sqrt(
                    Math.pow(e.clientX - mouseDownPos.x, 2) +
                    Math.pow(e.clientY - mouseDownPos.y, 2)
                );
                if (distance < 5) {
                    const url = this.getAttribute('data-url');
                    if (url) {
                        window.location.href = url;
                    }
                }
            }
        });
    });

    // Initialize grid occupancy
    updateGridOccupancy();

    // Initialize weather hex if it exists
    const weatherHex = container.querySelector('.hexagon[data-site="weather"]');
    if (weatherHex) {
        fetchWeather().then(weather => {
            const img = weatherHex.querySelector('.favicon');
            img.src = weather.icon;
            // Store weather data as data attributes for potential tooltip use
            if (weather.temp !== null) {
                weatherHex.setAttribute('data-temp', `${weather.temp}°${weather.tempUnit}`);
                weatherHex.setAttribute('data-condition', weather.condition);
            }
        }).catch(err => {
            console.error('Failed to fetch weather:', err);
            // Keep default icon
        });
    }
});
