import { RefOf } from '@metafox/framework';
import css from 'dom-css';
import { isString } from 'lodash';
import raf, { cancel as caf } from 'raf';
import React, { Component } from 'react';
import getInnerHeight from '../utils/getInnerHeight';
import getInnerWidth from '../utils/getInnerWidth';
import getScrollbarWidth from '../utils/getScrollbarWidth';
import returnFalse from '../utils/returnFalse';
import {
  Container,
  HorizontalThumb,
  HorizontalTrack,
  VerticalThumb,
  VerticalTrack,
  View
} from './defaultRenderElements';
import {
  disableSelectStyle,
  disableSelectStyleReset,
  viewStyleAutoHeight,
  viewStyleUniversalInitial
} from './styles';

export type ScrollbarProps = {
  className?: string;
  scrollRef: RefOf<HTMLDivElement>;
  horizontal?: boolean;
  onScroll?: any;
  onScrollFrame?: any;
  onScrollStart?: any;
  onScrollStop?: any;
  onUpdate?: any;
  thumbSize?: number;
  thumbMinSize?: number;
  hideTracksWhenNotNeeded?: boolean;
  autoHide?: boolean;
  autoHideTimeout?: number;
  autoHideDuration?: number;
  autoHeight?: boolean;
  autoHeightMin?: number | string;
  autoHeightMax?: number | string;
  universal?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export default class Scrollbars extends Component<
  ScrollbarProps,
  {
    didMountUniversal: boolean;
  }
> {
  static defaultProps = {
    thumbMinSize: 30,
    hideTracksWhenNotNeeded: false,
    autoHide: true,
    autoHideTimeout: 1000,
    autoHeight: false,
    autoHeightMin: 0,
    autoHeightMax: 200,
    universal: false
  };
  prevPageX: number;
  prevPageY: number;
  requestFrame = 0;
  view: HTMLElement = null;
  trackHorizontal: HTMLElement = null;
  trackVertical: HTMLElement = null;
  thumbHorizontal: HTMLElement = null;
  thumbVertical: HTMLElement = null;
  viewScrollLeft: number = 0;
  viewScrollTop: number = 0;
  dragging: boolean;
  trackMouseOver: boolean;
  scrolling: any;
  lastViewScrollLeft: number;
  lastViewScrollTop: number;
  container: any;
  hideTracksTimeout: any;
  detectScrollingInterval: any;

  constructor(props, ...rest) {
    super(props, ...rest);

    this.getScrollLeft = this.getScrollLeft.bind(this);
    this.getScrollTop = this.getScrollTop.bind(this);
    this.getScrollWidth = this.getScrollWidth.bind(this);
    this.getScrollHeight = this.getScrollHeight.bind(this);
    this.getClientWidth = this.getClientWidth.bind(this);
    this.getClientHeight = this.getClientHeight.bind(this);
    this.getValues = this.getValues.bind(this);
    this.getThumbHorizontalWidth = this.getThumbHorizontalWidth.bind(this);
    this.getThumbVerticalHeight = this.getThumbVerticalHeight.bind(this);
    this.getScrollLeftForOffset = this.getScrollLeftForOffset.bind(this);
    this.getScrollTopForOffset = this.getScrollTopForOffset.bind(this);

    this.scrollLeft = this.scrollLeft.bind(this);
    this.scrollTop = this.scrollTop.bind(this);
    this.scrollToLeft = this.scrollToLeft.bind(this);
    this.scrollToTop = this.scrollToTop.bind(this);
    this.scrollToRight = this.scrollToRight.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);

    this.handleTrackMouseEnter = this.handleTrackMouseEnter.bind(this);
    this.handleTrackMouseLeave = this.handleTrackMouseLeave.bind(this);
    this.handleHorizontalTrackMouseDown =
      this.handleHorizontalTrackMouseDown.bind(this);
    this.handleVerticalTrackMouseDown =
      this.handleVerticalTrackMouseDown.bind(this);
    this.handleHorizontalThumbMouseDown =
      this.handleHorizontalThumbMouseDown.bind(this);
    this.handleVerticalThumbMouseDown =
      this.handleVerticalThumbMouseDown.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);

    this.state = {
      didMountUniversal: false
    };
  }

  componentDidMount() {
    this.view = this.props.scrollRef.current;
    this.addListeners();
    this.update();
    this.componentDidMountUniversal();
  }

  componentDidMountUniversal() {
    // eslint-disable-line react/sort-comp
    const { universal } = this.props;

    if (!universal) return;

    this.setState({ didMountUniversal: true });
  }

  componentDidUpdate() {
    this.update();
  }

  componentWillUnmount() {
    this.removeListeners();
    caf(this.requestFrame);
    clearTimeout(this.hideTracksTimeout);
    clearInterval(this.detectScrollingInterval);
  }

  getScrollLeft() {
    if (!this.view) return 0;

    return this.view.scrollLeft;
  }

  getScrollTop() {
    if (!this.view) return 0;

    return this.view.scrollTop;
  }

  getScrollWidth() {
    if (!this.view) return 0;

    return this.view.scrollWidth;
  }

  getScrollHeight() {
    if (!this.view) return 0;

    return this.view.scrollHeight;
  }

  getClientWidth() {
    if (!this.view) return 0;

    return this.view.clientWidth;
  }

  getClientHeight() {
    if (!this.view) return 0;

    return this.view.clientHeight;
  }

  getValues() {
    const {
      scrollLeft = 0,
      scrollTop = 0,
      scrollWidth = 0,
      scrollHeight = 0,
      clientWidth = 0,
      clientHeight = 0
    } = this.view || {};

    return {
      left: scrollLeft / (scrollWidth - clientWidth) || 0,
      top: scrollTop / (scrollHeight - clientHeight) || 0,
      scrollLeft,
      scrollTop,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight
    };
  }

  getThumbHorizontalWidth() {
    const { thumbSize, thumbMinSize } = this.props;
    const { scrollWidth, clientWidth } = this.view;
    const trackWidth = getInnerWidth(this.trackHorizontal);
    const width = Math.ceil((clientWidth / scrollWidth) * trackWidth);

    if (trackWidth === width) return 0;

    if (thumbSize) return thumbSize;

    return Math.max(width, thumbMinSize);
  }

  getThumbVerticalHeight() {
    const { thumbSize, thumbMinSize } = this.props;
    const { scrollHeight, clientHeight } = this.view;
    const trackHeight = getInnerHeight(this.trackVertical);
    const height = Math.ceil((clientHeight / scrollHeight) * trackHeight);

    if (trackHeight === height) return 0;

    if (thumbSize) return thumbSize;

    return Math.max(height, thumbMinSize);
  }

  getScrollLeftForOffset(offset) {
    const { scrollWidth, clientWidth } = this.view;
    const trackWidth = getInnerWidth(this.trackHorizontal);
    const thumbWidth = this.getThumbHorizontalWidth();

    return (offset / (trackWidth - thumbWidth)) * (scrollWidth - clientWidth);
  }

  getScrollTopForOffset(offset) {
    const { scrollHeight, clientHeight } = this.view;
    const trackHeight = getInnerHeight(this.trackVertical);
    const thumbHeight = this.getThumbVerticalHeight();

    return (
      (offset / (trackHeight - thumbHeight)) * (scrollHeight - clientHeight)
    );
  }

  scrollLeft(left = 0) {
    if (!this.view) return;

    this.view.scrollLeft = left;
  }

  scrollTop(top = 0) {
    if (!this.view) return;

    this.view.scrollTop = top;
  }

  scrollToLeft() {
    if (!this.view) return;

    this.view.scrollLeft = 0;
  }

  scrollToTop() {
    if (!this.view) return;

    this.view.scrollTop = 0;
  }

  scrollToRight() {
    if (!this.view) return;

    this.view.scrollLeft = this.view.scrollWidth;
  }

  scrollToBottom() {
    if (!this.view) return;

    this.view.scrollTop = this.view.scrollHeight;
  }

  addListeners() {
    /* istanbul ignore if */
    if ('undefined' === typeof document || !this.view) return;

    const {
      view,
      trackHorizontal,
      trackVertical,
      thumbHorizontal,
      thumbVertical
    } = this;
    view.addEventListener('scroll', this.handleScroll);

    if (!getScrollbarWidth()) return;

    if (trackHorizontal) {
      trackHorizontal.addEventListener(
        'mouseenter',
        this.handleTrackMouseEnter
      );
      trackHorizontal.addEventListener(
        'mouseleave',
        this.handleTrackMouseLeave
      );
      trackHorizontal.addEventListener(
        'mousedown',
        this.handleHorizontalTrackMouseDown
      );
    }

    if (trackVertical) {
      trackVertical.addEventListener('mouseenter', this.handleTrackMouseEnter);
      trackVertical.addEventListener('mouseleave', this.handleTrackMouseLeave);
      trackVertical.addEventListener(
        'mousedown',
        this.handleVerticalTrackMouseDown
      );
    }

    if (thumbHorizontal) {
      thumbHorizontal.addEventListener(
        'mousedown',
        this.handleHorizontalThumbMouseDown
      );
    }

    if (thumbVertical) {
      thumbVertical.addEventListener(
        'mousedown',
        this.handleVerticalThumbMouseDown
      );
    }

    window.addEventListener('resize', this.handleWindowResize);
  }

  removeListeners() {
    /* istanbul ignore if */
    if ('undefined' === typeof document || !this.view) return;

    const {
      view,
      trackHorizontal,
      trackVertical,
      thumbHorizontal,
      thumbVertical
    } = this;
    view.removeEventListener('scroll', this.handleScroll);

    if (!getScrollbarWidth()) return;

    if (trackHorizontal) {
      trackHorizontal.removeEventListener(
        'mouseenter',
        this.handleTrackMouseEnter
      );
      trackHorizontal.removeEventListener(
        'mouseleave',
        this.handleTrackMouseLeave
      );
      trackHorizontal.removeEventListener(
        'mousedown',
        this.handleHorizontalTrackMouseDown
      );
    }

    if (trackVertical) {
      trackVertical.removeEventListener(
        'mouseenter',
        this.handleTrackMouseEnter
      );
      trackVertical.removeEventListener(
        'mouseleave',
        this.handleTrackMouseLeave
      );
      trackVertical.removeEventListener(
        'mousedown',
        this.handleVerticalTrackMouseDown
      );
    }

    if (thumbHorizontal) {
      thumbHorizontal.removeEventListener(
        'mousedown',
        this.handleHorizontalThumbMouseDown
      );
    }

    if (thumbVertical) {
      thumbVertical.removeEventListener(
        'mousedown',
        this.handleVerticalThumbMouseDown
      );
    }

    window.removeEventListener('resize', this.handleWindowResize);
    // Possibly setup by `handleDragStart`
    this.teardownDragging();
  }

  handleScroll(event) {
    const { onScroll, onScrollFrame } = this.props;

    if (onScroll) onScroll(event);

    this.update(values => {
      const { scrollLeft, scrollTop } = values;
      this.viewScrollLeft = scrollLeft;
      this.viewScrollTop = scrollTop;

      if (onScrollFrame) onScrollFrame(values);
    });
    this.detectScrolling();
  }

  handleScrollStart() {
    const { onScrollStart } = this.props;

    if (onScrollStart) onScrollStart();

    this.handleScrollStartAutoHide();
  }

  handleScrollStartAutoHide() {
    const { autoHide } = this.props;

    if (!autoHide) return;

    this.showTracks();
  }

  handleScrollStop() {
    const { onScrollStop } = this.props;

    if (onScrollStop) onScrollStop();

    this.handleScrollStopAutoHide();
  }

  handleScrollStopAutoHide() {
    const { autoHide } = this.props;

    if (!autoHide) return;

    this.hideTracks();
  }

  handleWindowResize() {
    this.update();
  }

  handleHorizontalTrackMouseDown(event) {
    event.preventDefault();
    const { target, clientX } = event;
    const { left: targetLeft } = target.getBoundingClientRect();
    const thumbWidth = this.getThumbHorizontalWidth();
    const offset = Math.abs(targetLeft - clientX) - thumbWidth / 2;
    this.view.scrollLeft = this.getScrollLeftForOffset(offset);
  }

  handleVerticalTrackMouseDown(event) {
    event.preventDefault();
    const { target, clientY } = event;
    const { top: targetTop } = target.getBoundingClientRect();
    const thumbHeight = this.getThumbVerticalHeight();
    const offset = Math.abs(targetTop - clientY) - thumbHeight / 2;
    this.view.scrollTop = this.getScrollTopForOffset(offset);
  }

  handleHorizontalThumbMouseDown(event) {
    event.preventDefault();
    this.handleDragStart(event);
    const { target, clientX } = event;
    const { offsetWidth } = target;
    const { left } = target.getBoundingClientRect();
    this.prevPageX = offsetWidth - (clientX - left);
  }

  handleVerticalThumbMouseDown(event) {
    event.preventDefault();
    this.handleDragStart(event);
    const { target, clientY } = event;
    const { offsetHeight } = target;
    const { top } = target.getBoundingClientRect();
    this.prevPageY = offsetHeight - (clientY - top);
  }

  setupDragging() {
    css(document.body, disableSelectStyle);
    document.addEventListener('mousemove', this.handleDrag);
    document.addEventListener('mouseup', this.handleDragEnd);
    document.onselectstart = returnFalse;
  }

  teardownDragging() {
    css(document.body, disableSelectStyleReset);
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
    document.onselectstart = undefined;
  }

  handleDragStart(event) {
    this.dragging = true;
    event.stopImmediatePropagation();
    this.setupDragging();
  }

  handleDrag(event) {
    if (this.prevPageX) {
      const { clientX } = event;
      const { left: trackLeft } = this.trackHorizontal.getBoundingClientRect();
      const thumbWidth = this.getThumbHorizontalWidth();
      const clickPosition = thumbWidth - this.prevPageX;
      const offset = -trackLeft + clientX - clickPosition;
      this.view.scrollLeft = this.getScrollLeftForOffset(offset);
    }

    if (this.prevPageY) {
      const { clientY } = event;
      const { top: trackTop } = this.trackVertical.getBoundingClientRect();
      const thumbHeight = this.getThumbVerticalHeight();
      const clickPosition = thumbHeight - this.prevPageY;
      const offset = -trackTop + clientY - clickPosition;
      this.view.scrollTop = this.getScrollTopForOffset(offset);
    }

    return false;
  }

  handleDragEnd() {
    this.dragging = false;
    this.prevPageX = this.prevPageY = 0;
    this.teardownDragging();
    this.handleDragEndAutoHide();
  }

  handleDragEndAutoHide() {
    const { autoHide } = this.props;

    if (!autoHide) return;

    this.hideTracks();
  }

  handleTrackMouseEnter() {
    this.trackMouseOver = true;
    this.handleTrackMouseEnterAutoHide();
  }

  handleTrackMouseEnterAutoHide() {
    const { autoHide } = this.props;

    if (!autoHide) return;

    this.showTracks();
  }

  handleTrackMouseLeave() {
    this.trackMouseOver = false;
    this.handleTrackMouseLeaveAutoHide();
  }

  handleTrackMouseLeaveAutoHide() {
    const { autoHide } = this.props;

    if (!autoHide) return;

    this.hideTracks();
  }

  showTracks() {
    clearTimeout(this.hideTracksTimeout);
    css(this.trackHorizontal, { opacity: 1 });
    css(this.trackVertical, { opacity: 1 });
  }

  hideTracks() {
    if (this.dragging) return;

    if (this.scrolling) return;

    if (this.trackMouseOver) return;

    const { autoHideTimeout } = this.props;
    clearTimeout(this.hideTracksTimeout);
    this.hideTracksTimeout = setTimeout(() => {
      css(this.trackHorizontal, { opacity: 0 });
      css(this.trackVertical, { opacity: 0 });
    }, autoHideTimeout);
  }

  detectScrolling() {
    if (this.scrolling) return;

    this.scrolling = true;
    this.handleScrollStart();
    this.detectScrollingInterval = setInterval(() => {
      if (
        this.lastViewScrollLeft === this.viewScrollLeft &&
        this.lastViewScrollTop === this.viewScrollTop
      ) {
        clearInterval(this.detectScrollingInterval);
        this.scrolling = false;
        this.handleScrollStop();
      }

      this.lastViewScrollLeft = this.viewScrollLeft;
      this.lastViewScrollTop = this.viewScrollTop;
    }, 100);
  }

  raf(callback) {
    if (this.requestFrame) raf.cancel(this.requestFrame);

    this.requestFrame = raf(() => {
      this.requestFrame = undefined;
      callback();
    });
  }

  update(callback) {
    this.raf(() => this._update(callback));
  }

  _update(callback) {
    const { onUpdate, hideTracksWhenNotNeeded } = this.props;
    const values = this.getValues();

    if (getScrollbarWidth()) {
      const { scrollLeft, clientWidth, scrollWidth } = values;
      const trackHorizontalWidth = getInnerWidth(this.trackHorizontal);
      const thumbHorizontalWidth = this.getThumbHorizontalWidth();
      const thumbHorizontalX =
        (scrollLeft / (scrollWidth - clientWidth)) *
        (trackHorizontalWidth - thumbHorizontalWidth);
      const thumbHorizontalStyle = {
        width: thumbHorizontalWidth,
        transform: `translateX(${thumbHorizontalX}px)`
      };
      const { scrollTop, clientHeight, scrollHeight } = values;
      const trackVerticalHeight = getInnerHeight(this.trackVertical);
      const thumbVerticalHeight = this.getThumbVerticalHeight();
      const thumbVerticalY =
        (scrollTop / (scrollHeight - clientHeight)) *
        (trackVerticalHeight - thumbVerticalHeight);
      const thumbVerticalStyle = {
        height: thumbVerticalHeight,
        transform: `translateY(${thumbVerticalY}px)`
      };

      if (hideTracksWhenNotNeeded) {
        const trackHorizontalStyle = {
          visibility: scrollWidth > clientWidth ? 'visible' : 'hidden'
        };
        const trackVerticalStyle = {
          visibility: scrollHeight > clientHeight ? 'visible' : 'hidden'
        };
        css(this.trackHorizontal, trackHorizontalStyle);
        css(this.trackVertical, trackVerticalStyle);
      }

      css(this.thumbHorizontal, thumbHorizontalStyle);
      css(this.thumbVertical, thumbVerticalStyle);
    }

    if (onUpdate) onUpdate(values);

    if ('function' !== typeof callback) return;

    callback(values);
  }

  render() {
    const scrollbarWidth = getScrollbarWidth();
    /* eslint-disable no-unused-vars */
    const {
      scrollRef,
      universal,
      autoHeight,
      autoHeightMin,
      autoHeightMax,
      style,
      children
    } = this.props;
    /* eslint-enable no-unused-vars */

    const { didMountUniversal } = this.state;

    const containerStyle = {
      ...(autoHeight && {
        minHeight: autoHeightMin,
        maxHeight: autoHeightMax
      }),
      ...style
    };

    const viewStyle = {
      // Hide scrollbars by setting a negative margin
      // marginRight: scrollbarWidth ? -scrollbarWidth : 0,
      // paddingRight: scrollbarWidth,
      marginBottom: scrollbarWidth ? -scrollbarWidth : 0,
      // paddingBottom: scrollbarWidth,
      ...(autoHeight && {
        ...viewStyleAutoHeight,
        // Add scrollbarWidth to autoHeight in order to compensate negative margins
        minHeight: isString(autoHeightMin)
          ? `calc(${autoHeightMin} + ${scrollbarWidth}px)`
          : autoHeightMin + scrollbarWidth,
        maxHeight: isString(autoHeightMax)
          ? `calc(${autoHeightMax} + ${scrollbarWidth}px)`
          : autoHeightMax + scrollbarWidth
      }),
      // Override min/max height for initial universal rendering
      ...(autoHeight &&
        universal &&
        !didMountUniversal && {
          minHeight: autoHeightMin,
          maxHeight: autoHeightMax
        }),
      // Override
      ...(universal && !didMountUniversal && viewStyleUniversalInitial)
    };

    const trackHorizontalStyle = {
      ...((!scrollbarWidth || (universal && !didMountUniversal)) && {
        display: 'none'
      })
    };

    const trackVerticalStyle = {
      ...((!scrollbarWidth || (universal && !didMountUniversal)) && {
        display: 'none'
      })
    };

    return (
      <Container
        style={containerStyle}
        ref={ref => {
          this.container = ref;
        }}
      >
        <View
          ref={scrollRef}
          style={viewStyle as any}
          scrollBarWidth={scrollbarWidth ? -scrollbarWidth : 0}
        >
          {children}
        </View>
        <HorizontalTrack
          ref={x => {
            this.trackHorizontal = x;
          }}
          style={trackHorizontalStyle}
        >
          <HorizontalThumb
            ref={x => {
              this.thumbHorizontal = x;
            }}
          />
        </HorizontalTrack>
        <VerticalTrack
          style={trackVerticalStyle}
          ref={x => {
            this.trackVertical = x;
          }}
        >
          <VerticalThumb
            ref={x => {
              this.thumbVertical = x;
            }}
          />
        </VerticalTrack>
      </Container>
    );
  }
}
