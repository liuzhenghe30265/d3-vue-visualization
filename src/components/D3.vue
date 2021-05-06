<!--
 * @Author: liuzhenghe
 * @Email: 15901450207@163.com
 * @Date: 2021-04-30 14:04:57
 * @LastEditors: liuzhenghe
 * @LastEditTime: 2021-05-06 09:47:51
 * @Descripttion: 图谱可视化
-->

<template>
  <div
    class="d3-container">
    <div
      class="types">
      <span
        v-for="(value, key, index) of typeCategories"
        :key="index"
        :style="{backgroundColor: typeColor[key]}"
        @mouseover="handleTypeMouseover(value, key)"
        @mouseout="handleTypeMouseout()">
        {{ key }}({{ value.length }})
      </span>
    </div>
    <div
      class="info">
      {{ info }}
    </div>
    <div
      class="btns">
      <span
        id="zoomIn">
        +
      </span>
      <span
        id="zoomOut">
        -
      </span>
      <span
        id="reset">
        reset
      </span>
    </div>
    <svg />
  </div>
</template>

<script>
import * as d3 from 'd3'
import mock from './mock.json'
export default {
  data() {
    return {
      info: '',
      typeCategories: {},
      typeColor: {}, // 类型配色
      type: ['Disease', 'Symptom', 'Age', 'Sex', 'BodyStructure', 'Check', 'Thing', 'Severity', 'Population', 'Side', 'BetterAndWorse', 'Body', 'Aggravate', 'Imaging', 'Relieve', 'Event', 'Base', 'Finding', 'BodyStructure_test', 'Action', 'Time'], // 分类
      nodes: [], // 节点集
      links: [], // 关系集
      visibleFlag: false
    }
  },
  watch: {
    nodes: {
      handler(val) {
        // 监听节点变化，设置类型标签
        const obj = {}
        val.forEach(e => {
          if (Object.keys(obj).indexOf('' + e.semantic_type) === -1) {
            obj[e.semantic_type] = []
          }
          obj[e.semantic_type].push(e)
        })
        this.typeCategories = obj
      },
      deep: true
    }
  },
  mounted() {
    this.setTypeColor()
    this.initD3()
  },
  methods: {
    handleTypeMouseout() {
      d3.selectAll('.single-node').style('opacity', 1)
      d3.selectAll('.single-line').style('opacity', 1)
    },
    handleTypeMouseover(data) {
      d3.selectAll('.single-node').style('opacity', 0.1)
      d3.selectAll('.single-line').style('opacity', 0.1)
      for (let i = 0; i < data.length; i++) {
        const nodeID = '#single-node' + data[i].id
        d3.selectAll(nodeID).style('opacity', 1)
      }
    },
    setTypeColor() {
      const obj = {}
      this.type.forEach(e => {
        if (Object.keys(obj).indexOf('' + e) === -1) {
          obj[e] = ''
        }
        obj[e] = this.randomColor()
      })
      this.typeColor = obj
    },
    randomColor() {
      const colors = ['#F4AB87', '#EEC88D', '#76CADF', '#97DA9D', '#88DCD8', '#FB7F89', '#F0E403', '#F576BE', '#ACADFF', '#7EC3FB', '#D0DB02', '#C07B11', '#00ACC2', '#2AAD41', '#A59D00', '#EB4747', '#CD0EBD', '#DE3997']
      return colors[Math.floor(Math.random() * colors.length)]
    },
    initD3() {
      const _this = this
      // 数据示例
      // nodes = [
      //   { id: 'a', name: 'a' },
      //   { id: 'b', name: 'b' },
      //   { id: 'c', name: 'c' }
      // ]
      // links = [
      //   { id: 'ab', source: 'a', target: 'b' },
      //   { id: 'bc', source: 'b', target: 'c' }
      // ]

      // 容器
      const svg = d3.select('svg')
        .attr('viewBox', [-window.innerWidth / 2, -window.innerHeight / 2, window.innerWidth, window.innerHeight])

      // 缩放
      const zoom = d3.zoom()
        .on('zoom', function () {
          svg.attr('transform', d3.zoomTransform(svg.node()))
          // const tran = d3.zoomTransform(svg.node())
          // const _k = tran.k
          // console.log(tran)
          // console.log(Math.floor(_k * 100) / 100)
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

      // 新建一个力导向图
      const simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody().strength(-1000))
        .force('link', d3.forceLink().id(d => d.id).distance(200))
        .force('x', d3.forceX())
        .force('y', d3.forceY())
        .on('tick', ticked)

      // 关系路径
      let link = svg.append('g')
        .attr('class', 'link-container')
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .selectAll('line')

      // 关系文字
      let linkText = svg.append('g')
        .attr('class', 'link-text-container')
        .attr('stroke', '#000')
        .attr('stroke-width', 1.5)
        .selectAll('text')

      // 节点
      let node = svg.append('g')
        .attr('class', 'node-container')
        .selectAll('circle')

      function ticked() {
        node
          .attr('transform', function (d) {
            return 'translate(' + d.x + ',' + d.y + ')'
          })

        link.attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)

        linkText
          .attr('x', d => (d.source.x + d.target.x) / 2)
          .attr('y', d => (d.source.y + d.target.y) / 2)
      }

      // 更新
      const updateObj = Object.assign(svg.node(), {
        update({ nodes, links }) {
          // 做一个浅复制，以防止突变，回收旧节点以保持位置和速度
          const old = new Map(node.data().map(d => [d.id, d]))
          nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d))
          links = links.map(d => Object.assign({}, d))

          // 节点
          node = node
            .data(nodes, d => d.id)
            .join(
              enter =>
                enter.append('g')
                  .attr('class', 'single-node')
                  .attr('id', (d) => {
                    return 'single-node' + d.id
                  })
            )
            .call(d3.drag()
              .on('start', dragstarted)
              .on('drag', dragged)
              .on('end', dragended))
          d3.selectAll('.single-node')
            .append('circle')
            .attr('r', 30)
            .attr('fill', nodeColor)
            .style('cursor', 'pointer')
          // 节点文字
          d3.selectAll('.single-node')
            .append('text')
            .attr('y', 0)
            .attr('dy', 5)
            .attr('text-anchor', 'middle')
            .style('cursor', 'pointer')
            .attr('x', function (d) {
              return textBreaking(d3.select(this), d, false)
            })

          // 绘制箭头
          svg.append('g')
            .attr('class', 'arrow-marker')
            .append('marker')
            .attr('id', 'arrow-marker')
            .attr('markerUnits', 'strokeWidth') // 设置为 strokeWidth 箭头会随着线的粗细发生变化
            .attr('markerUnits', 'userSpaceOnUse')
            .attr('viewBox', '0 -5 10 10') // 坐标系的区域
            .attr('refX', 40) // 箭头坐标
            .attr('refY', 0)
            .attr('markerWidth', 10) // 标识的大小
            .attr('markerHeight', 10)
            .attr('orient', 'auto') // 绘制方向，可设定为：auto（自动确认方向）和 角度值
            .attr('stroke-width', 2) // 箭头宽度
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5') // 箭头的路径
            .attr('fill', '#000') // 箭头颜色

          // 关系路径
          link = link
            .data(links, d => [d.source, d.target])
            .join(
              enter =>
                enter.append('line')
                  .attr('class', 'single-line')
                  .attr('id', (d) => {
                    return 'single-line' + d.id
                  })
                  .attr('marker-end', 'url(#arrow-marker)') // 根据箭头标记的 id 号标记箭头
            )

          // 路径文字
          linkText = linkText
            .data(links, d => [d.source, d.target])
            .join(
              enter =>
                enter.append('text')
                  .attr('class', 'link-text')
                  .attr('id', (d) => {
                    return 'link-text' + d.id
                  })
                  .text((d) => {
                    return d.semantic_type
                  })
                  .attr('stroke', '#000')
                  .attr('stroke-width', '1')
                  .attr('fill', 'none')
                  .style('cursor', 'pointer')
            )

          simulation.nodes(nodes)
          simulation.force('link').links(links)
          simulation.alpha(1).restart()

          node
            .on('click', function (d) {
              _this.visibleFlag = !_this.visibleFlag
              toggleMenu(d3.select(this), d, _this.visibleFlag)
            })
            .on('mouseover', function (d) {
              // 鼠标移入节点，高亮当前节点及与当前节点有关系的路径和节点
              d3.selectAll('.single-node').style('opacity', 0.2)
              d3.selectAll('.single-line').style('opacity', 0.2)
              d3.selectAll('.link-text').style('opacity', 0.2)
              d3.select('#single-node' + d.id).style('opacity', 1)
              const relationLinks = []
              _this.links.forEach((item) => {
                if (item.source === d.id || item.target === d.id) {
                  relationLinks.push(item)
                }
              })
              relationLinks.forEach((item) => {
                d3.select('#single-line' + item.id).style('opacity', 1)
                d3.select('#link-text' + item.id).style('opacity', 1)
                d3.select('#single-node' + item.source).style('opacity', 1)
                d3.select('#single-node' + item.target).style('opacity', 1)
              })
              _this.info = JSON.stringify(d)
            })
            .on('mouseout', function () {
              d3.selectAll('.single-node').style('opacity', 1)
              d3.selectAll('.single-line').style('opacity', 1)
              d3.selectAll('.link-text').style('opacity', 1)
              _this.info = ''
            })

          link
            .on('mouseover', function (d) {
              d3.selectAll('.single-node').style('opacity', 0.2)
              d3.selectAll('.single-line').style('opacity', 0.2)
              d3.selectAll('.link-text').style('opacity', 0.2)
              d3.select('#single-line' + d.id).style('opacity', 1)
              d3.select('#link-text' + d.id).style('opacity', 1)
              d3.select('#single-node' + d.source.id).style('opacity', 1)
              d3.select('#single-node' + d.target.id).style('opacity', 1)
              _this.info = JSON.stringify(d)
            })
            .on('mouseout', function () {
              d3.selectAll('.single-node').style('opacity', 1)
              d3.selectAll('.single-line').style('opacity', 1)
              d3.selectAll('.link-text').style('opacity', 1)
              _this.info = ''
            })
        }
      })

      /**
       * @name: 设置节点颜色
       * @param {*} node
       */
      function nodeColor(node) {
        const type = node.semantic_type
        if (_this.typeColor[type]) {
          return _this.typeColor[type]
        } else {
          return '#ddd'
        }
      }

      /**
       * @name: 新增节点和关系
       * @param {*} node
       */
      function addNodesAndLinks(node) {
        // 模拟接口返回节点和关系数据
        _this.$nextTick(() => {
          const res = mock
          const resData = res.data.relations
          const edgeResult = []
          for (let i = 0; i < resData.length; i++) {
            edgeResult[i] = {
              id: resData[i].id,
              source: resData[i].direction === 0 ? node.id : resData[i].relation_node.id,
              target: resData[i].direction === 0 ? resData[i].relation_node.id : node.id,
              relation: resData[i].name,
              name: resData[i].name,
              properties: resData[i].properties,
              semantic_type: resData[i].semantic_type
            }
          }
          const nodeReault = resData.map(_ => _.relation_node)
          nodeReault.forEach((item) => {
            _this.nodes.push(item)
          })
          _this.nodes.push({
            'id': 'qwertyuiop',
            'name': '测试无关系节点',
            'semantic_type': 'Symptom',
            'labels': ['Concept', 'Symptom'],
            'properties': {
              'scenes': 'allinmd',
              'status': 1,
              'lastModified': 1618293198,
              'releaseDate': 1618293198
            }
          })
          edgeResult.forEach((item) => {
            _this.links.push(item)
          })
          updateObj.update({
            nodes: _this.nodes,
            links: _this.links
          })
        })
      }

      /**
       * @name: 关联节点去重重组
       * @param {*} objarray
       */
      function uniqObjInArray(objarray) {
        const len = objarray.length
        const tempJson = {}
        const res = []
        for (let i = 0; i < len; i++) {
          // 取出每一个对象
          tempJson[JSON.stringify(objarray[i])] = true
        }
        const keyItems = Object.keys(tempJson)
        for (let j = 0; j < keyItems.length; j++) {
          res.push(JSON.parse(keyItems[j]))
        }
        return res
      }

      /**
       * @name: 收起，删除当前节点下一级没有其他关系的节点
       * @param {*} node
       */
      function deleteNextNodes(node) {
        const relationNode = []
        const relationList = []
        const hasRelationList = []
        d3.selectAll('.single-line').each(function (e) {
          if (e.source.id === node.id) {
            hasRelationList.push(e)
          } else {
            relationList.push(e) // 删除节点有关系的其他关系
          }
          // 需要删除的节点相关的节点
          if (e.source.id === node.id) {
            relationNode.push(e.target)
          }
          if (e.target.id === node.id) {
            relationNode.push(e.source)
          }
        })
        let tempNodeList = JSON.parse(JSON.stringify(relationNode))
        tempNodeList = uniqObjInArray(tempNodeList)
        // 区分下级节点是否是孤节点，如果还有其他关系，则不能删除
        tempNodeList.forEach(function (item) {
          const hasLine = relationList.findIndex(jtem => jtem.target.id === item.id || jtem.source.id === item.id)
          if (hasLine >= 0) {
            item.notSingle = true
          }
        })
        tempNodeList.forEach(function (item) {
          if (!item.notSingle) {
            d3.select('#single-node' + item.id).remove()
          }
        })
        const otherTempNode = []
        tempNodeList = tempNodeList.map(item => {
          if (!item.notSingle) {
            otherTempNode.push(item)
          }
        })
        hasRelationList.forEach(item => {
          otherTempNode.forEach(jtem => {
            if (jtem.id === item.source.id || jtem.id === item.target.id) {
              d3.select('#single-line' + item.id).remove()
              d3.select('#link-text' + item.id).remove()
            }
          })
        })
        d3.select('.menu-circle').remove()
      }

      /**
       * @name: 隐藏，删除当前及下一级没有其他关系的节点
       * @param {*} node
       */
      function deleteNodeAndLinks(node) {
        const removeIndex = _this.nodes.findIndex(data => data.id === node.id)
        _this.nodes.splice(removeIndex, 1)
        const relationNode = []
        const relationList = []
        const clickNode = node.id
        d3.selectAll('.single-line').each(function (e) {
          if (e.source.id === node.id || e.target.id === node.id) {
            d3.select(this).remove()
          } else {
            relationList.push(e)
          }
          // 需要删除的节点相关的节点
          if (e.source.id === node.id) {
            relationNode.push(e.target)
          }
        })
        let tempNodeList = JSON.parse(JSON.stringify(relationNode))
        tempNodeList = uniqObjInArray(tempNodeList)
        // 区分下级节点是否是孤节点
        tempNodeList.forEach(function (item) {
          const hasLine = relationList.findIndex(jtem => jtem.target.id === item.id || jtem.source.id === item.id)
          if (hasLine >= 0) {
            item.notSingle = true
          }
        })
        tempNodeList.forEach(function (item) {
          if (!item.notSingle) {
            d3.select('#single-node' + item.id).remove()
          }
        })
        d3.selectAll('.single-node').each(function (d) {
          const temp = d.id
          // 删除当前需要隐藏的节点
          if (temp === clickNode) {
            d3.select('.menu-circle').remove()
            d3.select(this).remove()
          }
        })
        d3.selectAll('.link-text').each(function (e) {
          if (e.source === node || e.target === node) {
            d3.select(this).remove()
          }
        })
      }

      /**
       * @name: 生成操作菜单
       * @param {*} current 当前元素
       * @param {*} d 当前元素对应的数据
       * @param {*} flag 显隐
       */
      function toggleMenu(current, d, flag) {
        const currentD = d
        const data = [{
          population: 30,
          value: '隐藏',
          type: 'delete'
        }, {
          population: 30,
          value: '收起',
          type: 'showOn'
        }, {
          population: 30,
          value: '展开',
          type: 'showOff'
        }]
        // 创建一个环生成器
        const arc = d3.arc()
          .innerRadius(80) // 内半径
          .outerRadius(35) // 外半径
        const pie = d3.pie()
          .value(function (d) {
            return d.population
          })
          .sort(null)
        const pieData = pie(data)
        const pieAngle = pieData.map(function (p) {
          return (p.startAngle + p.endAngle) / 2 / Math.PI * 180
        })
        // 菜单容器
        const g = current
          .append('g')
          .attr('class', 'menu-circle')
          .attr('width', 100)
          .attr('height', 100)
        const Pie = g.append('g')
        Pie.selectAll('path')
          .data(pie(data))
          .enter()
          .append('path')
          .attr('d', arc)
          .attr('fill', '#d3d7dc')
          .style('stroke', '#fff')
          .style('cursor', 'pointer')
          .on('click', function (d) {
            if (d.data.type === 'delete') {
              deleteNodeAndLinks(currentD)
            } else if (d.data.type === 'showOn') {
              deleteNextNodes(currentD)
            } else {
              addNodesAndLinks(currentD)
            }
            d3.event.stopPropagation()
          })
          .on('mouseover', function () {
            d3.select(this)
              .style('fill', '#d3d7dc')
              .transition()
              .style('fill', '#aaaeb4')
          })
          .on('mouseout', function () {
            d3.select(this)
              .style('fill', '#aaaeb4')
              .transition()
              .style('fill', '#d3d7dc')
          })

        // 安妮文字
        const labelFontSize = 12
        const labelValRadius = (170 * 0.35 - labelFontSize * 0.35)
        const labelValRadius1 = (170 * 0.35 + labelFontSize * 0.35)
        const labelsVals = current
          .select('.menu-circle')
          .append('g')
          .classed('labelsvals', true)
        // 定义两条路径以使标签的方向正确
        labelsVals.append('def')
          .append('path')
          .attr('id', 'label-path-1')
          .attr('d', `m0 ${-labelValRadius} a${labelValRadius} ${labelValRadius} 0 1,1 -0.01 0`)
        labelsVals.append('def')
          .append('path')
          .attr('id', 'label-path-2')
          .attr('d', `m0 ${-labelValRadius1} a${labelValRadius1} ${labelValRadius1} 0 1,0 0.01 0`)
        labelsVals.selectAll('text')
          .data(data)
          .enter()
          .append('text')
          .attr('dy', function (d) {
            if (d.type === 'showOn') {
              return -5
            } else {
              return 5
            }
          })
          .style('font-size', labelFontSize)
          .style('fill', 'black')
          .style('font-weight', 'bold')
          .style('text-anchor', 'middle')
          .append('textPath')
          .style('cursor', 'pointer')
          .attr('href', function (d, i) {
            const angle = pieAngle[i]
            if (angle > 90 && angle <= 270) { // 根据角度选择路径
              return '#label-path-2'
            } else {
              return '#label-path-1'
            }
          })
          .attr('startOffset', function (d, i) {
            const p = pieData[i]
            const angle = pieAngle[i]
            const percent = (p.startAngle + p.endAngle) / 2 / 2 / Math.PI * 100
            if (angle > 90 && angle <= 270) { // 分别计算每条路径的正确百分比
              return 100 - percent + '%'
            }
            return percent + '%'
          })
          .text(function (d) {
            return d.value
          })
          .on('click', function (d) {
            if (d.type === 'delete') {
              deleteNodeAndLinks(currentD)
            } else if (d.type === 'showOn') {
              deleteNextNodes(currentD)
            } else {
              addNodesAndLinks(currentD)
            }
            d3.event.stopPropagation()
          }, true)
        if (flag === false) {
          d3.selectAll('.menu-circle').remove()
        }
      }

      /**
       * @name: 节点文字换行
       * @param {*} dom
       * @param {*} data
       * @param {*} breaking 是否换行
       */
      function textBreaking(dom, data, breaking) {
        const text = data.name
        if (breaking) {
          const len = text.length
          if (len <= 3) {
            dom.append('tspan')
              .attr('x', 0)
              .attr('y', 0)
              .text(text)
          } else {
            const topText = text.substring(0, 3)
            const midText = text.substring(3, 7)
            let botText = text.substring(7, len)
            let topY = -22
            let midY = 8
            const botY = 34
            if (len <= 9) {
              topY += 10
              midY += 10
            } else {
              botText = text.substring(7, 9) + '...'
            }
            dom.text('')
            dom.append('tspan')
              .attr('x', 0)
              .attr('y', topY)
              .text(function () {
                return topText
              })
            dom.append('tspan')
              .attr('x', 0)
              .attr('y', midY)
              .text(function () {
                return midText
              })
            dom.append('tspan')
              .attr('x', 0)
              .attr('y', botY - 7)
              .text(function () {
                return botText
              })
          }
        } else {
          dom.append('tspan')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', 12)
            .style('stroke', '#333')
            .text(data.name)
        }
      }

      /**
        * @name: 拖动
        * @param {*} event
        */
      function dragstarted(event) {
        if (!d3.event.active) {
          simulation.alphaTarget(0.8).restart() // 设置衰减系数，对节点位置移动过程的模拟，数值越高移动越快，数值范围[0, 1]
        }
        event.fx = event.x
        event.fy = event.y
      }
      function dragged(event) {
        event.fx = d3.event.x
        event.fy = d3.event.y
      }
      function dragended(event) {
        if (!d3.event.active) {
          simulation.alphaTarget(0)
        }
        event.fx = null
        event.fy = null
      }

      // updateObj.update({
      //   nodes: _this.nodes,
      //   links: _this.links
      // })

      // 模拟接口返回节点信息
      _this.$nextTick(() => {
        // 初次返回单个节点
        const res = {
          'code': 0,
          'message': '',
          'data': {
            'id': '83c8aeb69c1011eb892ad31672d12132',
            'name': '骨筋膜室综合症',
            'semantic_type': 'Disease',
            'labels': ['Concept', 'Disease'],
            'properties': {
              'scenes': 'allinmd',
              'status': 1,
              'lastModified': 1618293198,
              'releaseDate': 1618293198
            }
          }
        }
        const data = res.data
        _this.nodes.push(data)
        updateObj.update({
          nodes: _this.nodes,
          links: _this.links
        })
      })
    }
  }
}
</script>

<style>
.d3-container {
  position: relative;
}
.d3-container .info {
  background: #fff;
  position: absolute;
  left: 50px;
  bottom: 50px;
  z-index: 9;
}
.d3-container .btns {
  background: #fff;
  position: absolute;
  right: 50px;
  bottom: 200px;
  z-index: 99;
}
.d3-container .btns span {
  cursor: pointer;
}
.d3-container .types {
  position: absolute;
  left: 50px;
  top: 50px;
  z-index: 9;
}
.d3-container .types span {
  display: inline-block;
  background: #a5abb6;
  border-radius: 4px;
  margin-right: 10px;
  padding: 5px 6px;
  cursor: pointer;
  color: #2e0f00;
  font-size: 12px;
}
</style>
