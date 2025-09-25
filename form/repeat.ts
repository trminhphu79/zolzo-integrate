import { Component, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';

type Address = { street: string; city: string };

@Component({
  selector: 'app-address-array',
  templateUrl: './address-array.component.html',
})
export class AddressArrayComponent implements OnInit {
  form = new FormGroup({ addresses: new FormArray<FormGroup>([]) });

  // model must mirror the FormArray length
  model: { addresses: Address[] } = { addresses: [{ street: '', city: '' }] };

  // per-row options (keeps field state per item)
  optionsList: FormlyFormOptions[] = [];

  // fields for ONE address row (keys are relative to the row group)
  addressFields: FormlyFieldConfig[] = [
    {
      fieldGroup: [
        { key: 'street', type: 'input', templateOptions: { label: 'Street', required: true } },
        { key: 'city',   type: 'input', templateOptions: { label: 'City',   required: true } },
      ],
    },
  ];

  ngOnInit(): void {
    this.syncFormArrayWithModel();
  }

  get addressesFA(): FormArray<FormGroup> {
    return this.form.get('addresses') as FormArray<FormGroup>;
  }

  // Build/resize the FormArray to match model.addresses
  private syncFormArrayWithModel() {
    this.addressesFA.clear();
    this.optionsList = [];
    for (let i = 0; i < this.model.addresses.length; i++) {
      this.addressesFA.push(new FormGroup({}));
      this.optionsList.push({});
    }
  }

  addRow(initial: Address = { street: '', city: '' }) {
    this.model.addresses.push(initial);
    this.addressesFA.push(new FormGroup({}));
    this.optionsList.push({});
  }

  removeRow(i: number) {
    this.addressesFA.removeAt(i);
    this.model.addresses.splice(i, 1);
    this.optionsList.splice(i, 1);
  }

  trackByIndex = (i: number) => i;

  submit() {
    if (this.form.valid) console.log('model', this.model);
  }
}

<form [formGroup]="form" (ngSubmit)="submit()">
  <ng-container formArrayName="addresses">
    <div
      *ngFor="let group of addressesFA.controls; let i = index; trackBy: trackByIndex"
      [formGroupName]="i"
      class="row"
    >
      <!-- 👇 Embed Formly for this row -->
      <formly-form
        [form]="group"
        [fields]="addressFields"
        [model]="model.addresses[i]"
        [options]="optionsList[i]"
      ></formly-form>

      <button type="button" (click)="removeRow(i)">Remove</button>
      <hr />
    </div>
  </ng-container>

  <button type="button" (click)="addRow()">+ Add</button>
  <button type="submit" [disabled]="form.invalid">Submit</button>
</form>