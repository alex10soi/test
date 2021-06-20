const { src, dest, series, parallel, watch } = require("gulp");
const browserSync = require("browser-sync");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const cleanCss = require("gulp-clean-css");
const less = require("gulp-less");
const preprocessor = "less";
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const del = require("del");

function browsersync() {
  browserSync.init({
    server: {
      baseDir: "app/",
      notify: false,
      online: false,
    },
  });
}

function scripts() {
  return src(["node_modules/jquery/dist/jquery.min.js", "app/js/app.js"])
    .pipe(concat("app.min.js"))
    .pipe(uglify())
    .pipe(dest("app/js/"))
    .pipe(browserSync.stream()); // запускает автоматическое обновление браузера
}

function startwatch() {
  watch(["app/**/*.js", "!app/**/*.min.js"], scripts); // scripts => указываем эту функцию, которая выступает как тригер для начала отслеживания изменений в файл

  watch([`app/${preprocessor}/**/*.${preprocessor}`], styles);
  watch(["app/index.html"]).on("change", browserSync.reload);
  watch(["app/image/**/*"], imageMin);  // отслеживает директорию картинок на предмет изменений  
}

function styles() {
  return (
    src(`app/${preprocessor}/**/*.${preprocessor}`)
      .pipe(eval(preprocessor)())
      .pipe(concat("app.min.css"))
      // .pipe(eval(preprocessor)())
      .pipe(
        autoprefixer({
          overrideBrowserslist: ["last 10 versions"],
          grid: true, // для лучшей работы grid сетки в браузерах Internet Explore
          cascade: false, // располжение стилей префиксов каскадным стилем
        })
      )
      .pipe(
        cleanCss({ level: { 1: { specialComments: 0 } }, format: "beautify" })
      ) // очищает код css от всего не нужного. А свойство specialComments => убирает даже комментарии. свойствоство format => редактирует код путем его выравнивания
      .pipe(browserSync.stream())
      .pipe(dest("app/css/"))
  );
}

function imageMin() {
  return src("app/image/src/**/*")
    .pipe(newer("app/image/dist")) // для отслеживания файлов картинок, которые находятся в dest функции ниже (а точнее в папке указанной как выходной для файлов)
    .pipe(imagemin())
    .pipe(dest("app/image/dist"))
    .pipe(browserSync.stream());
}

function cleanimg() {
  return del("app/image/dist/**/*", { force: true }); // заметьте, что мы немного поправили путь к выходным  файлам для их нахождения и удаления перед обработкой и запуском других команд описанных выше. Данный плагин предотвращает возникновения тех же файлов в наших выходных директориях
}


function cleandist() {
  return del("app/dist/**/*", { force: true });
}


function buildCopy () {
  return src([
    "app/css/**/*.min.js",
    "app/js/**/*.min.js",
    "app/image/dist/**/*",
    "app/**/*.html"
  ], {base: 'app'})   // свойтсво base сохраняет структуру папок тех файлов которые участвуют в обработке, а значение 'app' означает откуда берутся файлы и сохраняет структру вложеннности этой директории при копировании файлов, как в данном примере функции
  .pipe(dest("dist"));
}

exports.browsersync = browsersync;
exports.scripts = scripts;
exports.default = parallel(series(cleanimg, imageMin), styles, scripts, browsersync, startwatch);
exports.styles = styles;
exports.imagemin = imageMin;
exports.del = cleanimg;

exports.build = series(cleandist, styles, scripts, imageMin, buildCopy);
