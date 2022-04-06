<template>
  <div
    class="d3map-container">
    <div
      class="info">
      {{ info }}
    </div>
    <svg />
  </div>
</template>

<script>
import * as d3 from 'd3'
import data from './ChinaGeoData.json'
export default {
  data () {
    return {
      info: ''
    }
  },
  watch: {
    nodes: {
      handler () {
      },
      deep: true
    }
  },
  mounted () {
    this.initD3()
  },
  methods: {

    randomColor () {
      const colors = ['#F4AB87', '#EEC88D', '#76CADF', '#97DA9D', '#88DCD8', '#FB7F89', '#F0E403', '#F576BE', '#ACADFF', '#7EC3FB', '#D0DB02', '#C07B11', '#00ACC2', '#2AAD41', '#A59D00', '#EB4747', '#CD0EBD', '#DE3997']
      return colors[Math.floor(Math.random() * colors.length)]
    },
    initD3 () {
      const _this = this
      const containerWidth = window.innerWidth
      const containerHeight = window.innerHeight
      // 容器
      const svg = d3.select('svg')
        .attr('viewBox', [0, 0, containerWidth, containerHeight])

      // 缩放
      const zoom = d3.zoom()
        .on('zoom', function () {
          svg.attr('transform', d3.zoomTransform(svg.node()))
        })
      svg.call(zoom)

      d3.select('#reset')
        .on('click', function () {
          svg.call(zoom.transform, d3.zoomIdentity)
        })
      d3.select('#zoomIn')
        .on('click', function () {
          zoom.scaleBy(svg, 1.1)
        })
      d3.select('#zoomOut')
        .on('click', function () {
          zoom.scaleBy(svg, 0.9) // 执行该方法后 会触发 zoom 事件 0.9 缩小
        })

      const projection = d3
        .geoMercator() // 定义墨卡托地理投射(平面投射)
        .center([107, 31])
        .scale(d3.min([containerWidth / 2, containerHeight / 2]))
        .translate([containerWidth / 2, containerHeight / 2])

      const path = d3
        .geoPath() // 定义路径
        .projection(projection)

      const g = svg
        .append('g')
        // .attr('transform', 'translate(' + -(containerWidth / 2) + ',' + -(containerHeight / 2) + ')') // 设最外包层在总图上的相对位置
        .style('fill-opacity', 1)

      // eslint-disable-next-line no-unused-vars
      const province = g
        .selectAll('path') // 绘画所有的省
        .data(data.features)
        .enter()
        .append('path')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('fill', function () {
          return _this.randomColor()
        })
        .attr('d', path)
        .on('mouseover', function (d) {
          if (d.properties.name) {
            _this.info = d.properties.name
          }
          d3.select(this).attr('fill', 'yellow')
        })
        .on('mouseout', function () {
          _this.info = ''
          d3.select(this).attr('fill', function () {
            return _this.randomColor()
          })
        })
    }
  }
}
</script>

<style>
.info {
  position: absolute;
  top: 50px;
  left: 50px;
}
</style>

