import { Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  selector: 'formly-wrapper-transloco-label',
  template: `
    <label *ngIf="to.labelKey" [attr.for]="id">
      {{ to.labelKey | transloco : to.labelParams }}
    </label>
    <ng-container #fieldComponent></ng-container>
  `,
})
export class TranslocoLabelWrapper extends FieldWrapper {}