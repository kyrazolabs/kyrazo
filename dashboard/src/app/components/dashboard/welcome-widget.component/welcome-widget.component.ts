import { Component, inject, OnInit } from "@angular/core";
import { StorageService } from "@core/services/storage.service";
import { SettingService } from "@core/services/settings.service";

@Component({
  selector: "app-welcome-widget",
  imports: [],
  templateUrl: "./welcome-widget.component.html",
  styleUrl: "./welcome-widget.component.scss",
})
export class WelcomeWidgetComponent implements OnInit {
  private ss = inject(StorageService);
  private settingsService = inject(SettingService);

  userName: string = "User";

  ngOnInit() {
    const storedName = this.ss.getItem<string>("user_name");
    if (storedName) {
      this.userName = storedName.split(" ")[0]; // Use first name if full name
    } else {
      // Fallback: Fetch profile if name not in storage
      this.settingsService.get().subscribe({
        next: (response) => {
          if (response.data) {
            this.userName = response.data.firstName;
            // Optionally cache it to avoid refetch on every reload?
            // Better to let AuthService handle auth-time caching.
            // We can just use it here.
          }
        },
        error: () => {
          // Keep default 'User'
        },
      });
    }
  }
}
