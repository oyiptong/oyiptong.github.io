'use strict';

/**
This code is one of my first encounter with javascript, it's probably full of bugs and the quality is
most definitely low.
None of the algorithms implemented here are efficient, but they offer a good visual demonstration
of the idea behind the talk.
*/

var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const w = canvas.width;
const h = canvas.height;

let sources = [];
for (let i = 0; i < config.source.number; i++) {
    const src = {
        position: {
            x: Math.floor(w / config.screenCuts),
            y: Math.floor((i + 1) * (h - config.bottomOffset) / (config.source.number + 1))
        },
        targetPosition: {
            x: Math.floor(w / config.screenCuts),
            y: Math.floor((i + 1) * (h - config.bottomOffset) / (config.source.number + 1))
        },
        active: true,
        load: [],
        stats: []
    };
    sources.push(src);
}
alignSources();

function alignSources() {
    // add missing sources
    const j = sources.length;
    for (let i = j; i < config.source.number; i++) {
        const src = {
            position: {
                x: sources[j - 1].position.x,
                y: sources[j - 1].position.y
            },
            targetPosition: {
                x: sources[j - 1].position.x,
                y: sources[j - 1].position.y
            },
            active: true,
            load: [],
            stats: []
        };
        for (let i = 0; i < config.server.number; i++) {
            src.load[i] = 0;
            src.stats[i] = new Stats(i);
        }
        sources.push(src);
    }

    // update target position
    for (let i = 0; i < config.source.number; i++) {
        const source = sources[i];
        source.targetPosition.x = Math.floor(w / config.screenCuts);
        source.targetPosition.y = Math.floor((i + 1) * (h - config.bottomOffset) / (config.source.number + 1));
    }

    // update position
    for (let i = 0; i < config.source.number; i++) {
        const source = sources[i];
        const dx = source.targetPosition.x - source.position.x;
        const dy = source.targetPosition.y - source.position.y;

        if (dx * dx + dy * dy < 10) {
            source.position.x = source.targetPosition.x;
            source.position.y = source.targetPosition.y;
        } else {
            source.position.x = source.position.x + dx / 50;
            source.position.y = source.position.y + dy / 50;
        }
    }

    // delete extra sources, and their requests/responses
    for (let i = config.source.number; i < sources.length; i++) {
        const source = sources[i];
        source.active = false;
        for (let req of requests) {
            if (req.dest === source || req.src === source) {
                requests.delete(req);
            }
        }
    }
    sources = sources.splice(0, config.source.number);
}

let servers = [];
for (let i = 0; i < config.server.number; i++) {
    const server = new Server({
        x: Math.floor((config.screenCuts - 1) * w / config.screenCuts),
        y: Math.floor((i + 1) * (h - config.bottomOffset) / (config.server.number + 1)),
    });
    server.targetPosition = {
        x: server.position.x,
        y: server.position.y,
    };
    server.id = i;
    servers.push(server);
}
allignServers();

function allignServers() {
    // add missing servers
    const j = servers.length;
    for (let i = j; i < config.server.number; i++) {
        //console.log('Creating new Server entry ' + i);
        const server = new Server({
            x: servers[j - 1].position.x,
            y: servers[j - 1].position.y
        });
        server.targetPosition = {
            x: servers[j - 1].position.x,
            y: servers[j - 1].position.y,
        };
        server.id = i;
        servers.push(server);

        // add an empty entry in the load array of clients
        for (let k = 0; k < config.source.number; k++) {
            const source = sources[k];
            source.load[i] = 0;
            // console.log('new Stats on ' + i);
            source.stats[i] = new Stats(i);
            if (source.serverPool) {
                source.serverPool.push(i);
                _.shuffle(source.serverPool);
            }
        }
    }

    // update targetPosition
    for (let i = 0; i < config.server.number; i++) {
        const server = servers[i];
        server.targetPosition.x = Math.floor((config.screenCuts - 1) * w / config.screenCuts),
            server.targetPosition.y = Math.floor((i + 1) * (h - config.bottomOffset) / (config.server.number + 1));
    }

    // update position
    for (let i = 0; i < config.server.number; i++) {
        const server = servers[i];
        const dx = server.targetPosition.x - server.position.x;
        const dy = server.targetPosition.y - server.position.y;

        if (dx * dx + dy * dy < 10) {
            server.position.x = server.targetPosition.x;
            server.position.y = server.targetPosition.y;
        } else {
            server.position.x = server.position.x + dx / 50;
            server.position.y = server.position.y + dy / 50;
        }
    }

    // delete extra servers, and their requests/responses
    for (let i = config.server.number; i < servers.length; i++) {
        const server = servers[i];
        server.active = false;
        server.close();
        for (let req of requests) {
            if (req.dest === server || req.src === server) {
                requests.delete(req);

                // also decrement the load of the client since it will never receive its request
                if (req.dest.load) { // if its a req client -> server
                    req.dest.load[req.destId] -= 1;
                }
                if (req.dest.stats) { // if its a req client -> server
                    const penalty = 60 * 1000; // penalty for req disappear
                    req.dest.stats[req.destId].decr(penalty);
                }
            }
        }
    }
    servers = servers.splice(0, config.server.number);
    // delete load entries in each clients
    for (let k = 0; k < config.source.number; k++) {
        const source = sources[k];
        if (source.load.length > config.server.number) {
            // console.log("Splicing source load datastructure " + k)
            source.load.splice(0, config.server.number);
            source.stats.splice(0, config.server.number);

            source.aperture = _.filter(source.aperture, serverData => serverData.id < config.server.number);
            source.serverPool = _.filter(source.serverPool, id => id < config.server.number);
        }
    }
}

let requests = new Set();
let histogram = new WindowHistogram({
    factory: () => new Histogram({
        maxDuration: 60 * 1000,
        bucketSize: 10
    }),
    count: 20,
    windowMs: config.windowMs / config.windowCount,
    position: {
        x: 10,
        y: 920
    },
    dimension: {
        x: 250,
        y: 150
    }
});
let heatMap = new HeatMap({
    windowHistogram: histogram,
    position: {
        x: 300,
        y: 920
    },
    dimension: {
        x: 540,
        y: 150
    }
});
let latencyPlot = new LatencyPlot({
    position: {
        x: 10,
        y: 920
    },
    dimension: {
        x: 830,
        y: 150
    },
    windowMs: config.windowMs
});

function alignGraphs() {
    const graphs = [];
    if (config.showHistogram) {
        graphs.push(histogram);
    }
    if (config.showLatencyPlot) {
        graphs.push(latencyPlot);
    }
    if (config.showHeatMap) {
        graphs.push(heatMap);
    }

    const spacing = config.fontSize + 10;
    const y = canvas.height - spacing - 15;
    const w = (canvas.width - (graphs.length + 1) * spacing) / graphs.length;
    for (let i = 0; i < graphs.length; i++) {
        const g = graphs[i];
        g.position.x = spacing + (w + spacing) * i;
        g.position.y = y;
        g.dimension.x = w;
        g.dimension.y = config.bottomOffset;
    }
}

function normalRandom() {
    var u = 1 - Math.random(); // Subtraction to flip [0, 1) to (0, 1].
    var v = 1 - Math.random();
    let x = (5 + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)) / 10;
    x = Math.max(0.0, x);
    x = Math.min(x, 1.0);
    return x;
}

// let requestQueue = [];
// let lastRefresh = 0;
// const REFRESH_PERIOD = 1000;

// function scheduleRequest() {
//     const now = CLOCK.now();
//     const rps = config.source.globalRps;

//     for (let i = 0; i < rps; i++) {
//         const dt = Math.round(1000 * Math.random());
//         const sendTime = now + dt;
//         requestQueue.push(sendTime);
//     }
//     requestQueue = _.sortBy(requestQueue, req => { return req.sendTime });
// }

let lastRefresh = Date.now();
let emitStopped = true;

function emitRequest() {
    const rndSource = Math.min(sources.length - 1, Math.floor(Math.random() * config.source.number));
    const src = sources[rndSource];

    // init missing load/stats data-structure
    if (src.load.length < config.server.number) {
        for (let k = src.load.length; k < config.server.number; k++) {
            src.load[k] = 0;
        }
    }
    for (let k = 0; k < config.server.number; k++) {
        if (!src.stats) {
            src.stats = [];
        }
        if (!src.stats[k]) {
            src.stats[k] = new Stats(k);
        }
    }



    var rndServer = 0;
    if (config.loadbalancing == "roundrobin") {
        if (!src.roundRobinId) {
            src.roundRobinId = _.random(0, servers.length - 1);
        }
        rndServer = src.roundRobinId % servers.length;
        src.roundRobinId++;
    } else if (config.loadbalancing == "leastloaded") {
        const minLoad = _.min(src.load);

        // in case of equal lowest values, select randomly
        var mins = [];
        for (let j = 0; j < src.load.length; j++) {
            const load = src.load[j];
            if (load == minLoad) {
                mins.push(j);
            }
        }
        rndServer = mins[Math.floor(Math.random() * mins.length)];
    } else if (config.loadbalancing == "p2c") {
        if (src.load.length < 2) {
            rndServer = 0;
        } else {
            const i0 = _.random(0, src.load.length - 1);
            let i1 = _.random(0, src.load.length - 2);
            if (i1 >= i0) {
                i1++;
            }

            const load0 = src.load[i0];
            const load1 = src.load[i1];
            if (load0 < load1) {
                rndServer = i0;
            } else {
                rndServer = i1;
            }
        }
    } else if (config.loadbalancing.startsWith("aperture")) {
        const minConnectionNumber = config.aperture.minConnections;
        const maxConnectionNumber = config.aperture.maxConnections;

        if (!src.aperture) {
            src.serverPool = _.range(servers.length);
            src.serverPool = _.shuffle(src.serverPool);
            src.aperture = [];
            for (let i = 0; i < minConnectionNumber; i++) {
                src.aperture.push({
                    id: src.serverPool.pop(),
                    counter: 0
                });
            }
            src.lastApertureRefresh = Date.now();
        }
        const connectionNumber = src.aperture.length;

        let outstandings = 0;
        for (let j = 0; j < src.load.length; j++) {
            outstandings += src.load[j];
        }

        const minRatio = config.aperture.minRatio;
        const maxRatio = config.aperture.maxRatio;

        const now = Date.now();
        const elapsed = now - src.lastApertureRefresh;
        let n = 0;

        function dumpState() {
            for (let j = 0; j < servers.length; j++) {
                const isInAperture = _.find(src.aperture, ap => j == ap.id) != undefined;
                if (isInAperture)
                    console.log(rndSource + ": IN  " + j + " -> " + src.stats[j].predictiveLoad() + "=" + src.stats[j].median() + " * " + src.stats[j]._outstandings);
                else
                    console.log(rndSource + ": OUT " + j + " -> " + src.stats[j].predictiveLoad() + "=" + src.stats[j].median() + " * " + src.stats[j]._outstandings);
            }
        }
        function closeWorstConnection() {
            // find the worst
            src.aperture = _.shuffle(src.aperture);
            const evictedServer = _.minBy(src.aperture, serverData => serverData.counter);
            const index = src.aperture.indexOf(evictedServer)
            src.aperture.splice(index, 1)[0];
            // console.log(rndSource + ": Closing connection " + index);

            src.serverPool.push(evictedServer.id);
            src.lastApertureRefresh = now;
        }
        function closeSlowestConnection() {
            // find the worst
            src.aperture = _.shuffle(src.aperture);
            // const medians = _.map(src.aperture, serverData => src.stats[serverData.id].median());
            const medians = _.map(src.aperture, serverData => src.stats[serverData.id].predictiveLoad());
            const medians0 = _.map(src.aperture, serverData => {
                return {
                    id: serverData.id,
                    median: src.stats[serverData.id].median(),
                    stats: src.stats[serverData.id]
                };
            });
            const sortedMedians0 = _.sortBy(medians0, m => -m.median);
            const maxMedian0 = sortedMedians0[0];

            let maxMedian = Number.MIN_VALUE;
            let index = 0;
            for (let j = 0; j < medians.length; j++) {
                const median = medians[j];
                if (maxMedian < median) {
                    maxMedian = median;
                    index = j;
                }
            }

            dumpState();
            const removedServer = src.aperture.splice(index, 1)[0];
            console.log(rndSource + ": Evicting slowest connection " + removedServer.id);
            console.log("");

            src.serverPool.push(removedServer.id);
            src.lastApertureRefresh = now;
        }

        function establishNewConnection() {
            // establish connection
            src.serverPool = _.shuffle(src.serverPool);
            const id = src.serverPool.pop();
            // console.log(rndSource + ": Establishing new connection " + id);
            if (id || id == 0) {
                src.aperture.push({
                    id: id,
                    counter: 0
                });
            } else {
                // console.log(rndSource + ": no more server to connect to");
            }
            src.lastApertureRefresh = now;
        }
        function resetCounter() {
            for (let serverData of src.aperture) {
                serverData.counter = 0;
            }
        }

        if (src.aperture.length < minConnectionNumber) {
            for (let k = 0; k < minConnectionNumber - src.aperture.length; k++) {
                establishNewConnection();
            }
        }

        if (config.loadbalancing == "aperture-leastloaded") {
            if (elapsed > config.aperture.minRefreshPeriod && minRatio * outstandings < connectionNumber && connectionNumber > minConnectionNumber) {
                // console.log(rndSource + ": Decreasing pool size, outstandings=" + outstandings);
                closeWorstConnection();
            } else if (elapsed > config.aperture.minRefreshPeriod && maxRatio * connectionNumber < outstandings && connectionNumber < maxConnectionNumber) {
                // console.log(rndSource + ": Increasing pool size, outstandings=" + outstandings);
                establishNewConnection();
            } else if (elapsed > config.aperture.refreshPeriod) {
                // console.log(rndSource + ": Recycling");
                establishNewConnection();
                if (connectionNumber > minConnectionNumber) {
                    closeWorstConnection();
                }
                resetCounter();
            }

            if (src.aperture.length < minConnectionNumber) {
                debugger;
            }

            // pick the least-loaded server in the aperture
            let bestServer = _.minBy(src.aperture, serverData => src.load[serverData.id] || 0);
            n = src.aperture.indexOf(bestServer)
            if (n < 0) {
                debugger;
            }
        } else if (config.loadbalancing == "aperture-predictive") {
            if (elapsed > config.aperture.minRefreshPeriod && minRatio * outstandings < connectionNumber && connectionNumber > minConnectionNumber) {
                closeSlowestConnection();
            } else if (elapsed > config.aperture.minRefreshPeriod && maxRatio * connectionNumber < outstandings && connectionNumber < maxConnectionNumber) {
                establishNewConnection();
            }
            if (elapsed > config.aperture.refreshPeriod) {
                establishNewConnection();
                if (connectionNumber > minConnectionNumber) {
                    closeSlowestConnection();
                }
                resetCounter();
            }

            if (src.aperture.length < minConnectionNumber) {
                debugger;
            }

            // pick the fastest server in the aperture

            // select 3 different random numbers in [0, src.aperture.length - 1]
            const i0 = _.random(0, src.aperture.length - 1);
            let i1 = _.random(0, src.aperture.length - 2);
            let i2 = _.random(0, src.aperture.length - 3);
            if (i1 >= i0) {
                i1++;
                if (i2 >= i0) {
                    i2++;
                }
                if (i2 >= i1) {
                    i2++;
                }
            } else {
                if (i2 >= i1) {
                    i2++;
                }
                if (i2 >= i0) {
                    i2++;
                }
            }

            const load0 = {i: i0, load: src.stats[src.aperture[i0].id].predictiveLoad()};
            const load1 = {i: i1, load: src.stats[src.aperture[i1].id].predictiveLoad()};
            const load2 = {i: i2, load: src.stats[src.aperture[i2].id].predictiveLoad()};

            let loads = [load0, load1, load2];
            loads = _.shuffle(loads);
            loads = _.sortBy(loads, l => l.load);
            n = loads[0].i;
        } else {
            if (elapsed > 1000 && minRatio * outstandings < connectionNumber && connectionNumber > minConnectionNumber) {
                // closing connection
                const serverData = src.aperture.pop();
                if (serverData) {
                    src.serverPool.push(serverData.id);
                }
                src.lastApertureRefresh = now;
            } else if (elapsed > 1000 && maxRatio * connectionNumber < outstandings && connectionNumber < maxConnectionNumber) {
                // establish connection
                establishNewConnection();
            }

            // pick a random server in the aperture
            n = _.random(0, src.aperture.length - 1);
        }
        if (!src.aperture[n]) {
            debugger;
        }
        src.aperture[n].counter++;

        rndServer = src.aperture[n].id;

        dumpState();
        console.log(rndSource + ": AP picking " + rndServer);
        console.log("");

    } else { // default to random
        rndServer = Math.floor(Math.random() * config.server.number);
    }
    rndServer = Math.min(servers.length - 1, rndServer);
    const dest = servers[rndServer];
    if (!dest) {
        debugger;
    }
    const work = config.source.work();

    const req = new Request(src, dest, work);
    req.srcId = rndSource;
    req.destId = rndServer;
    req.sendTime = Date.now();
    req.originalSendTime = Date.now();

    src.load[rndServer] = (src.load[rndServer] || 0) + 1
    if (!src.stats[rndServer]) {
        src.stats[rndServer] = new Stats(rndServer);
    }
    src.stats[rndServer].incr();
    // console.log("INCR load[" + rndServer + "] = " + src.load[rndServer]);

    requests.add(req);

    const rps = config.source.globalRps;
    const dt = Math.floor(1000 / rps * normalRandom()) / config.speed;

    if (!config.emitPaused) {
        if (Date.now() < lastRefresh + 100 * dt) {
            // reschedule next request.
            setTimeout(emitRequest, dt);
        } else {
            emitStopped = true;
        }
    }
}

function update() {
    const now = Date.now();
    alignSources();
    allignServers();
    if (config.alignGraphs) {
        alignGraphs();
    }
    requests.forEach((req, _, set) => {
        req.update(now);
    });
    latencyPlot.update(now);
}

function draw() {
    ctx.font = config.fontSize + "px Arial";

    if (config.drawHeader) {
        ctx.fillStyle = "#000";
        ctx.fillText("Loadbalancing algorithm: '" + config.loadbalancing + "'", 10, 10 + config.fontSize);
        ctx.fillText("Requests per sec: " + config.source.globalRps, 10, 12 + 2 * config.fontSize);
        if (config.showHistogram) {
            ctx.fillText("p99: " + histogram.p99, 10, 12 + 3 * config.fontSize);
        }
    }

    if (config.drawAnimation) {
        if (config.loadbalancing.startsWith("aperture")) {
            ctx.strokeStyle = '#DCDCDC';
            for (let src of sources) {
                if (src.aperture) {
                    for (let serverData of src.aperture) {
                        const server = servers[serverData.id];
                        ctx.beginPath();
                        ctx.moveTo(src.position.x, src.position.y);
                        ctx.lineTo(server.position.x, server.position.y);
                        ctx.stroke();
                    }
                }
            }
        }

        let clientLabel = "Client";
        if (sources.length > 1) {
            clientLabel += "s"
        }
        ctx.fillStyle = "#000";
        ctx.fillText(clientLabel, sources[0].position.x - 15, sources[0].position.y - config.fontSize - 10);
        ctx.fillStyle = "#009";
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];
            ctx.beginPath();
            ctx.arc(source.position.x, source.position.y, config.circleSize, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            if (config.source.showLoad) {
                const fontSize = 20;
                ctx.font = fontSize + "px Arial";
                for (let j = 0; j < source.load.length; j++) {
                    ctx.fillText('' + source.load[j], source.position.x - 2*fontSize, source.position.y + (-source.load.length / 2 + j) * fontSize + fontSize);
                }
                ctx.font = config.fontSize + "px Arial";
            }
            if (config.source.showLatency) {
                ctx.fillText(
                    'Load / Median (#)',
                    source.position.x - config.fontSize * 9, source.position.y + (-source.load.length / 2) * config.fontSize);

                for (let j = 0; j < source.stats.length; j++) {
                    const stats = source.stats[j];
                    const isInAperture = _.find(source.aperture, ap => j == ap.id) != undefined;
                    if (isInAperture) {
                        ctx.fillStyle = "#009";
                    } else {
                        ctx.fillStyle = "#CCC";
                    }
                    if (stats) {
                        const loadTxt = ("000000" + stats.predictiveLoad().toFixed(0)).slice(-6);
                        const medianTxt = ("00000" + stats.median().toFixed(0)).slice(-5);
                        ctx.fillText(
                            loadTxt + ' / '
                            + medianTxt
                            + ' (' + stats._outstandings + ')',
                            source.position.x - config.fontSize * 10, source.position.y + (-source.load.length / 2 + j + 1) * config.fontSize);
                    }
                }
            }
        }

        let serverLabel = "Server";
        if (servers.length > 1) {
            serverLabel += "s"
        }
        ctx.fillStyle = "#000";
        ctx.fillText(serverLabel, servers[0].position.x - 30, servers[0].position.y - config.fontSize - 10);
        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            server.draw(ctx);
        }

        requests.forEach((req, _, set) => {
            req.draw(ctx);
        });
    }

    if (config.showHeatMap) {
        heatMap.draw(ctx)
    }
    if (config.showHistogram) {
        histogram.draw(ctx);
    }
    if (config.showLatencyPlot) {
        latencyPlot.draw(ctx);
    }

}

function loop() {
    lastRefresh = Date.now();
    if (!config.emitPaused) {
        if (emitStopped) {
            emitStopped = false;
            emitRequest();
        }
    }

    update(canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw();
    window.requestAnimationFrame(loop);
}

loop();

// let moveTarget = null;
// let moveOffsetX = 0;
// let moveOffsetY = 0;

// canvas.addEventListener('mousedown', function (e) {
//     const rect = canvas.getBoundingClientRect();
//     const x = e.screenX - rect.left;
//     const y = e.screenY - rect.top;

//     function targetElement(elem) {
//         const x0 = elem.position.x;
//         const x1 = x0 + elem.dimension.x;
//         const y0 = elem.position.y;
//         const y1 = y0 + elem.dimension.y;
//         if (x0 <= x && x <= x1  &&  y0 <= y && y <= y1) {
//             moveTarget = elem;
//             moveOffsetX = x - x0;
//             moveOffsetY = y - y0;
//         }
//     }

//     if (config.showLatencyPlot) {
//         targetElement(latencyPlot);
//     }
//     if (config.showHistogram) {
//         targetElement(histogram);
//     }
//     if (config.showHeatMap) {
//         targetElement(heatMap);
//     }
// });

// canvas.addEventListener('mouseup', function (e) {
//     moveTarget = null;
//     moveOffsetX = 0;
//     moveOffsetY = 0;
// });

// canvas.addEventListener('mousemove', function (e) {
//     const x = e.screenX;
//     const y = e.screenY;

//     if (moveTarget) {
//         moveTarget.position.x = x - moveOffsetX;
//         moveTarget.position.y = y - moveOffsetY;
//     }
// });

let nextActions = [];

function next() {
    if(nextActions.length > 0) {
        const fn = nextActions.splice(0,1)[0]
        fn();
    } else {
        console.log("Nothing to do");
    }
}

canvas.addEventListener('keydown', function(event) {
    console.log(event);
    next();
}, false);

function randomGC(numberOfServers, pauseMs) {
    let max = Math.min(numberOfServers, servers.length);
    let serverIds = new Set();
    for (let i=0; i<max; i++) {
        let index = _.random(0, servers.length - 1);
        while(serverIds.has(index)) {
            index = _.random(0, servers.length - 1);
        }
        serverIds.add(index);
    }
    serverIds.forEach(id => servers[id].gc(pauseMs));
}

