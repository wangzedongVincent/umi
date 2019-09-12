import React, { Component } from 'react';
import Treemap from './Treemap';
import Tooltip from './Tooltip';
import filesize from 'filesize';
import styles from './index.module.less';
import { Analyze } from '../../util/analyze';

const SIZE_SWITCH_ITEMS = [
  { label: 'Stat', prop: 'statSize' },
  { label: 'Parsed', prop: 'parsedSize' },
  { label: 'Gzipped', prop: 'gzipSize' },
];

interface IProps {
  analyze: Analyze;
}

class AnalyzeComponent extends Component<IProps> {
  treemap = null;

  saveRef = treemap => {
    this.treemap = treemap;
  };

  state = {
    showTooltip: false,
    tooltipContent: '',
  };

  handleMouseLeaveTreemap = () => {
    this.setState({
      showTooltip: false,
    });
  };

  renderModuleSize(module, sizeType) {
    const sizeProp = `${sizeType}Size`;
    const size = module[sizeProp];
    const sizeLabel = SIZE_SWITCH_ITEMS.find(item => item.prop === sizeProp).label;
    const isActive = true;

    return typeof size === 'number' ? (
      <div className={isActive ? styles.activeSize : ''}>
        {sizeLabel} size: <strong>{filesize(size)}</strong>
      </div>
    ) : null;
  }

  getTooltipContent = (module: any) => {
    if (!module) return null;

    return (
      <div>
        <div>
          <strong>{module.label}</strong>
        </div>
        <br />
        {this.renderModuleSize(module, 'stat')}
        {!module.inaccurateSizes && this.renderModuleSize(module, 'parsed')}
        {!module.inaccurateSizes && this.renderModuleSize(module, 'gzip')}
        {module.path && (
          <div>
            Path: <strong>{module.path}</strong>
          </div>
        )}
        {module.isAsset && (
          <div>
            <br />
            <strong>
              <em>Right-click to view options related to this chunk</em>
            </strong>
          </div>
        )}
      </div>
    );
  };

  handleTreemapGroupHover = event => {
    const { group } = event;
    if (!group) {
      this.setState({
        showTooltip: false,
      });
      return;
    }
    this.setState({
      showTooltip: true,
      tooltipContent: this.getTooltipContent(group),
    });
  };

  render() {
    const { analyze } = this.props;

    if (!analyze) {
      // 这儿要补一个插画的
      return <div>Love is Love</div>;
    }

    return (
      <div className={styles.container}>
        <Treemap
          className={styles.map}
          ref={this.saveRef}
          weightProp="parsedSize"
          data={analyze.visibleChunks}
          onMouseLeave={this.handleMouseLeaveTreemap}
          onGroupHover={this.handleTreemapGroupHover}
        />
        <Tooltip visible={this.state.showTooltip}>{this.state.tooltipContent}</Tooltip>
      </div>
    );
  }
}

export default AnalyzeComponent;
