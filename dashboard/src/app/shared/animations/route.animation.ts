import {
  animate,
  animateChild,
  group,
  query,
  style,
  transition,
  trigger,
} from "@angular/animations";

export const routeTransitionAnimations = trigger("routeAnimations", [
  transition("* <=> *", [
    query(
      ":enter, :leave",
      style({
        position: "absolute",
        index: 500,
        width: "100%",
        height: "100%",
      }),
      { optional: true }
    ),
    group([
      // خروج الصفحة القديمة
      query(
        ":leave",
        [
          style({
            opacity: 1,
            filter: "blur(0px)",
            transform: "translateY(0) scale(1)",
          }),
          animate(
            "250ms ease-in-out",
            style({
              opacity: 0,
              filter: "blur(5px)",
              transform: "translateY(-10px) scale(0.995)",
            })
          ),
        ],
        { optional: true }
      ),

      // دخول الصفحة الجديدة
      query(
        ":enter",
        [
          style({
            opacity: 0,
            filter: "blur(5px)",
            transform: "translateY(10px) scale(0.995)",
          }),
          animate(
            "450ms 100ms ease-in-out",
            style({
              opacity: 1,
              filter: "blur(0px)",
              transform: "translateY(0) scale(1)",
            })
          ),
          animateChild(),
        ],
        { optional: true }
      ),
    ]),
  ]),
]);
