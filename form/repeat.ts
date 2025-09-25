import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

type Address = {
  street: string;
  city: string;
  zip: string;
};

@Component({
  selector: 'app-address-form',
  templateUrl: './address-form.component.html',
})
export class AddressFormComponent {
  constructor(private fb: FormBuilder) {
    // seed with one row
    this.addAddress();
  }

  form = this.fb.group({
    addresses: this.fb.array<FormGroup<Address>>([]),
  });

  // typed getter for convenience
  get addresses(): FormArray<FormGroup<Address>> {
    return this.form.get('addresses') as FormArray<FormGroup<Address>>;
  }

  private buildAddressGroup(data?: Partial<Address>): FormGroup<Address> {
    return this.fb.group<Address>({
      street: new FormControl(data?.street ?? '', { nonNullable: true, validators: [Validators.required] }),
      city:   new FormControl(data?.city ?? '',   { nonNullable: true, validators: [Validators.required] }),
      zip:    new FormControl(data?.zip ?? '',    { nonNullable: true, validators: [Validators.pattern(/^\d{4,6}$/)] }),
    });
  }

  addAddress(data?: Partial<Address>) {
    this.addresses.push(this.buildAddressGroup(data));
  }

  removeAddress(index: number) {
    this.addresses.removeAt(index);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log('✅ Form value:', this.form.value);
  }

  trackByIndex = (_: number, __: unknown) => _;
}



<form [formGroup]="form" (ngSubmit)="submit()">
  <div formArrayName="addresses">
    <div
      *ngFor="let group of addresses.controls; let i = index; trackBy: trackByIndex"
      [formGroupName]="i"
      class="row"
    >
      <div>
        <label>Street</label>
        <input formControlName="street" />
        <small class="error" *ngIf="group.get('street')?.touched && group.get('street')?.invalid">
          Street is required
        </small>
      </div>

      <div>
        <label>City</label>
        <input formControlName="city" />
        <small class="error" *ngIf="group.get('city')?.touched && group.get('city')?.invalid">
          City is required
        </small>
      </div>

      <div>
        <label>ZIP</label>
        <input formControlName="zip" />
        <small class="error" *ngIf="group.get('zip')?.touched && group.get('zip')?.invalid">
          ZIP must be 4–6 digits
        </small>
      </div>

      <div class="actions">
        <button type="button" (click)="removeAddress(i)">Remove</button>
      </div>

      <hr />
    </div>
  </div>

  <div class="toolbar">
    <button type="button" (click)="addAddress()">+ Add</button>
    <button type="submit" [disabled]="form.invalid">Submit</button>
  </div>
</form>