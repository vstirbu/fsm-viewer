/* global dagreD3 */

module.exports = function state(parent, bbox, node) {
  const shapeSvg = parent
    .insert("rect", ":first-child")
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
