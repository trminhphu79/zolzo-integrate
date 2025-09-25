// my-form.component.ts
import { Component, DestroyRef, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-my-form',
  template: `
    <form [formGroup]="form">
      <formly-form [form]="form" [fields]="fields" [model]="model"></formly-form>
    </form>
  `,
})
export class MyFormComponent {
  private readonly t = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  form = new FormGroup({});
  model: any = {};

  fields: FormlyFieldConfig[] = [
    {
      key: 'email',
      type: 'input',
      templateOptions: {
        labelKey: 'form.email',               // <- store key
        placeholderKey: 'form.emailHint',
        required: true,
      },
      hooks: {
        onInit: (field) => {
          const stop = takeUntilDestroyed(this.destroyRef);
          const to = field.templateOptions!;

          this.t.selectTranslate(to.labelKey!)
            .pipe(stop)
            .subscribe(txt => to.label = txt);

          if (to.placeholderKey) {
            this.t.selectTranslate(to.placeholderKey)
              .pipe(stop)
              .subscribe(txt => to.placeholder = txt);
          }
        },
      },
    },
  ];
}