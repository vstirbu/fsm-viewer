/* global window */

function renderer(spec) {
  // Create a new directed graph
  const g = new dagreD3.graphlib.Graph().setGraph({});

  spec.final.forEach((state) => {
    g.setNode(state, { shape: 'final', label: '' });
  });

  spec.states.forEach((state) => {
    g.setNode(state.name, { shape: 'state', label: state.name });
  });

  spec.choices.forEach((state) => {
    g.setNode(state, { shape: 'choice', label: '' });
  });

  g.setNode(spec.initial, { shape: 'initial', label: '' });

  spec.events.forEach((event) => {
    g.setEdge(event.from, event.to, { label: event.label, arrowhead: 'vee' });
  });

  const svg = d3.select('svg');
  const inner = svg.select('g');

  // Set up zoom support
  const zoom = d3.zoom().on('zoom', function() {
        inner.attr('transform', d3.event.transform);
      });
  svg.call(zoom);

  // Fit svg to preview window
  svg.attr('height', window.innerHeight - 5);
  svg.attr('width', window.innerWidth - 5);

  // Create the renderer
  const render = new dagreD3.render();

  // Custom shapes
  render.shapes().initial = initial;
  render.shapes().final = final;
  render.shapes().state = state;
  render.shapes().choice = choice;

  // Run the renderer. This is what draws the final graph.
  render(inner, g);

  // Determine scaling factor
  const initialScale = scalingFactor(g, svg);

  // Center the graph
  const width = (svg.attr('width') - g.graph().width * initialScale) / 2;
  const height = (svg.attr('height') - g.graph().height * initialScale) / 2;

  svg.call(zoom.transform, d3.zoomIdentity.translate(width, height).scale(initialScale));
}

function resize() {
  const svg = d3.select('svg');

  svg.attr('height', window.innerHeight - 5);
  svg.attr('width', window.innerWidth - 5);
}

function scalingFactor(g, svg) {
  const graphHeight = g.graph().height;
  const svgHeight = svg.attr('height');
  const verticalScale = graphHeight > svgHeight ? svgHeight / (graphHeight + 20) : 1;

  const graphWidth = g.graph().width;
  const svgWidth = svg.attr('width');
  const horizontalScale = graphWidth > svgWidth ? svgWidth / (graphWidth + 20) : 1;

  return Math.min(horizontalScale, verticalScale);
}

function initial(parent, bbox, node) {
  const r = 15;
  const shapeSvg = parent.insert('circle', ':first-child')
    .attr('x', -bbox.width / 2)
    .attr('y', -bbox.height / 2)
    .attr('r', r)
    .classed('initial', true);

  node.intersect = function(point) {
    return dagreD3.intersect.circle(node, r, point);
  };

  return shapeSvg;
}

function final(parent, bbox, node) {
  const r = 15;
  const outerShapeSvg = parent.insert('circle', ':first-child')
    .attr('x', -bbox.width / 2)
    .attr('y', -bbox.height / 2)
    .attr('r', r);

    parent.append('circle')
    .attr('x', -bbox.width / 2)
    .attr('y', -bbox.height / 2)
    .attr('r', r - 5)
    .classed('final', true);

  node.intersect = function(point) {
    return dagreD3.intersect.circle(node, r, point);
  };

  return outerShapeSvg;
}

function state(parent, bbox, node) {
  const shapeSvg = parent.insert("rect", ":first-child")
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("x", -bbox.width / 2)
    .attr("y", -bbox.height / 2)
    .attr("width", bbox.width)
    .attr("height", bbox.height);

  node.intersect = function(point) {
    return dagreD3.intersect.rect(node, point);
  };

  return shapeSvg;
}

function choice(parent, bbox, node) {
  // const w = (bbox.width * Math.SQRT2) / 2;
  // const h = (bbox.height * Math.SQRT2) / 2;
  const w = 10;
  const h = 10;
  const points = [
    { x:  0, y: -h },
    { x: -w, y:  0 },
    { x:  0, y:  h },
    { x:  w, y:  0 }
  ];
  const shapeSvg = parent.insert("polygon", ":first-child")
    .attr('points', points.map(function(p) { return p.x + "," + p.y; }).join(" "))
    .classed('choice', true);

  node.intersect = function(p) {
    return dagreD3.intersect.polygon(node, points, p);
  };

  return shapeSvg;
}
