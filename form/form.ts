// my-form.component.ts
import { Component, DestroyRef, ViewChild, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyForm } from '@ngx-formly/core';
import { TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-my-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <formly-form #formlyRef
        [form]="form"
        [fields]="fields"
        [model]="model"
        [options]="options">
      </formly-form>

      <div class="mt-3 flex gap-2">
        <button type="button" (click)="addAddress()">+ Add address</button>
        <button type="submit">Submit</button>
      </div>
    </form>
  `,
})
export class MyFormComponent {
  @ViewChild('formlyRef') formlyRef!: FormlyForm;

  private readonly t = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  form = new FormGroup({});
  model: any = { addresses: [{ street: '', city: '' }] };
  options = {};

  fields: FormlyFieldConfig[] = [
    {
      key: 'addresses',
      type: 'repeat',
      fieldArray: {
        fieldGroup: [
          {
            key: 'street',
            type: 'input',
            templateOptions: {
              labelKey: 'address.street',            // 🔑 store keys, not text
              placeholderKey: 'address.streetHint',
              required: true,
            },
            hooks: { onInit: (f) => this.bindI18n(f) },
          },
          {
            key: 'city',
            type: 'input',
            templateOptions: {
              labelKey: 'address.city',
              placeholderKey: 'address.cityHint',
              required: true,
            },
            hooks: { onInit: (f) => this.bindI18n(f) },
          },
        ],
      },
    },
  ];

  /** translate label/placeholder & auto-update on lang change */
  private bindI18n(field: FormlyFieldConfig) {
    const stop = takeUntilDestroyed(this.destroyRef);
    const to = field.templateOptions ?? (field.templateOptions = {});
    const labelKey = to['labelKey'] as string | undefined;
    const labelParams = to['labelParams'];
    const phKey = to['placeholderKey'] as string | undefined;
    const phParams = to['placeholderParams'];

    if (labelKey) {
      this.t.selectTranslate(labelKey, labelParams).pipe(stop)
        .subscribe((txt) => (field.templateOptions!.label = txt));
    }
    if (phKey) {
      this.t.selectTranslate(phKey, phParams).pipe(stop)
        .subscribe((txt) => (field.templateOptions!.placeholder = txt));
    }
  }

  /** programmatically manage the group list (like FormArray) */
  addAddress(initial: any = { street: '', city: '' }) {
    this.model.addresses = [...(this.model.addresses ?? []), initial];
    this.formlyRef?.options?.resetModel?.(this.model);
  }

  removeAddress(index: number) {
    const next = [...(this.model.addresses ?? [])];
    next.splice(index, 1);
    this.model.addresses = next;
    this.formlyRef?.options?.resetModel?.(this.model);
  }

  moveAddress(index: number, dir: 1 | -1) {
    const arr = [...(this.model.addresses ?? [])];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    this.model.addresses = arr;
    this.formlyRef?.options?.resetModel?.(this.model);
  }

  /** optional: set any field’s label imperatively */
  async setFieldLabel(keyPath: (string | number)[], labelKey: string, params?: any) {
    const label = await firstValueFrom(this.t.selectTranslate(labelKey, params));
    const field = this.findFieldByKeyPath(this.fields, keyPath);
    if (field) {
      field.templateOptions = { ...(field.templateOptions ?? {}), label };
    }
  }

  private findFieldByKeyPath(fields: FormlyFieldConfig[], keyPath: (string | number)[]) {
    let current: FormlyFieldConfig | undefined;
    let level: FormlyFieldConfig[] = fields;

    for (const k of keyPath) {
      if (typeof k === 'number') {
        current = level.find(f => Array.isArray(f.fieldGroup))?.fieldGroup?.[k];
      } else {
        current = level.find(f => f.key === k);
      }
      if (!current) return null;
      level = current.fieldGroup ?? (current.fieldArray?.fieldGroup ?? []);
    }
    return current ?? null;
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('submit', this.model);
    }
  }
}