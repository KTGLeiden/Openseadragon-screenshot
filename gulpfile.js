"use strict";

const gulp = require("gulp");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");

gulp.task("min:js", async function () {
  return gulp
    .src("openseadragonScreenshot.js")
    .pipe(uglify())
    .pipe(rename("openseadragonScreenshot.min.js"))
    .pipe(gulp.dest("."));
});

gulp.task("default", gulp.series("min:js"));
