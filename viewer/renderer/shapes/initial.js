/* global dagreD3 */

module.exports = function initial(parent, bbox, node) {
  const r = 15;
  const shapeSvg = parent
    .insert('circle', ':first-child')
    .attr('x', -bbox.width / 2)
    .attr('y', -bbox.height / 2)
    .attr('r', r);

  parent.classed('initial', true);

  node.intersect = function(point) {
    return dagreD3.intersect.circle(node, r, point);
  };

  return shapeSvg;
};
