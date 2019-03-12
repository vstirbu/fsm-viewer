/* global dagreD3 */

module.exports = function choice(parent, bbox, node) {
  // const w = (bbox.width * Math.SQRT2) / 2;
  // const h = (bbox.height * Math.SQRT2) / 2;
  const w = 10;
  const h = 10;
  const points = [
    { x: 0, y: -h },
    { x: -w, y: 0 },
    { x: 0, y: h },
    { x: w, y: 0 }
  ];
  const shapeSvg = parent
    .insert('polygon', ':first-child')
    .attr(
      'points',
      points
        .map(function(p) {
          return p.x + ',' + p.y;
        })
        .join(' ')
    )
    .classed('choice', true);

  node.intersect = function(p) {
    return dagreD3.intersect.polygon(node, points, p);
  };

  return shapeSvg;
};
