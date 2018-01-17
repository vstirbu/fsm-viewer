module.exports = {
  scalingFactor
};

function scalingFactor(g, svg) {
  const graphHeight = g.graph().height;
  const svgHeight = svg.attr("height");
  const verticalScale =
    graphHeight > svgHeight ? svgHeight / (graphHeight + 20) : 1;

  const graphWidth = g.graph().width;
  const svgWidth = svg.attr("width");
  const horizontalScale =
    graphWidth > svgWidth ? svgWidth / (graphWidth + 20) : 1;

  return Math.min(horizontalScale, verticalScale);
}
