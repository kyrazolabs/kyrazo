import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { RouterLink } from "@angular/router";

export interface OnboardingState {
  hasSource: boolean;
  hasTarget: boolean;
  hasEvent: boolean;
}

@Component({
  selector: "app-onboarding-widget",
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  templateUrl: "./onboarding-widget.component.html",
})
export class OnboardingWidgetComponent {
  @Input() state: OnboardingState = {
    hasSource: false,
    hasTarget: false,
    hasEvent: false,
  };

  get progress(): number {
    let completed = 0;
    if (this.state.hasSource) completed++;
    if (this.state.hasTarget) completed++;
    if (this.state.hasEvent) completed++;
    return (completed / 3) * 100;
  }
}
