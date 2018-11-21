import { Component, OnInit, Input } from "@angular/core";
import { popupAnimation } from "./popup.animation";

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['popup.component.less'],
  animations: [popupAnimation]
})
export class PopupComponent implements OnInit {
  @Input('size') containerSize: string;
  @Input('closeAble') closeAble: boolean = true;
  @Input('closeFunc') closeFunc: Function;

  isShowed: boolean;
  class_size: string = 'normal_b';
  units_size: string = '';
  show_callback: Function;
  close_callback: Function;

  constructor() { }

  ngOnInit() {
    this.checkSize();
  }

  show(callback?: Function) {
    this.isShowed = true;

    (callback) ? callback() : null;
  }

  close(callback?: Function) {
    this.isShowed = false;

    (callback) ? callback() : null;
  }

  emitCallback() {
    if (this.isShowed) {
      if (this.show_callback) { this.show_callback(); console.log('Popup SHOWED!', this.isShowed); };
    }
    else {
      if (this.close_callback) { this.close_callback(); console.log('Popup CLOSEd!', this.isShowed); };
    }
  }

  checkSize() {
    if (this.containerSize) {
      switch (this.containerSize) {
        case 'normal_b': case 'wide_b': case 'small_b': case 'xsmall_b':
          this.class_size = this.containerSize;
          break;
        default:
          this.units_size = this.containerSize;
          this.class_size = '';
          break;
      }
    }
  }

}
