import { Directive, ElementRef, OnDestroy } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appDisableStepperFocus]'
})
export class DisableStepperFocusDirective implements OnDestroy {
  private sub!: Subscription;

  constructor(private el: ElementRef, private stepper: MatStepper) {}

  /** HTMLが描画された後に呼び出す */
  ngAfterViewInit(): void {
    this.disableStepperFocus();
    // ステップ変更を購読
    this.sub = this.stepper.selectionChange.subscribe(() => {
      // DOM生成や内部focus後に処理
      setTimeout(() => this.disableStepperFocus());
    });
  }

  /** 画面が変わる直前に呼び出す */
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** tabindexとフォーカスの制御 */
  private disableStepperFocus(): void {
    const headers = this.el.nativeElement.querySelectorAll('.mat-step-header');
    headers.forEach((header: HTMLElement) => {
      header.setAttribute('tabindex', '-1');
      // 強制的にステップからフォーカスを外す
      if (document.activeElement === header) {
        (header as HTMLElement).blur();
      }
    });
  }
}
