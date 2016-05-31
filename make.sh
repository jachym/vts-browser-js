CLOSURECOMPILER=../externals/closure-compiler/current/compiler.jar

mkdir build 

cd melown-core

# merge geodata workers
echo "Melown.geodataProcessorWorker = function() { " | cat - map/geodata/worker-globals.js map/geodata/worker-style.js map/geodata/worker-linestring.js map/geodata/worker-pointarray.js map/geodata/worker-text.js map/geodata/worker-main.js > ../build/geodata-worker-tmp.js
echo "};">> ../build/geodata-worker-tmp.js 

# merge melown-core 
cat utils/matrix.js \
    utils/math.js \
    utils/utils.js \
    utils/platform.js \
    utils/url.js \
    utils/http.js \
    inspector/inspector.js \
    inspector/input.js \
    inspector/stats.js \
    inspector/layers.js \
    inspector/graphs.js \
    renderer/gpu/bbox.js \
    renderer/gpu/device.js \
    renderer/gpu/font.js \
    renderer/gpu/geodata.js \
    renderer/gpu/group.js \
    renderer/gpu/line.js \
    renderer/gpu/mesh.js \
    renderer/gpu/pixel-line.js \
    renderer/gpu/pixel-line3.js \
    renderer/gpu/polygon.js \
    renderer/gpu/program.js \
    renderer/gpu/shaders.js \
    renderer/gpu/text.js \
    renderer/gpu/texture.js \
    renderer/gpu/tile.js \
    renderer/renderer.js \
    renderer/interface.js \
    renderer/bbox.js \
    renderer/camera.js \
    renderer/draw.js \
    renderer/geometry.js \
    renderer/init.js \
    map/map.js \
    ../build/geodata-worker-tmp.js \
    map/geodata/processor.js \
    map/bound-layer.js \
    map/cache.js \
    map/position.js \
    map/camera.js \
    map/config.js \
    map/credit.js \
    map/draw.js \
    map/interface.js \
    map/loader.js \
    map/measure.js \
    map/trajectory.js \
    map/mesh.js \
    map/metanode-tracer.js \
    map/metanode.js \
    map/metastorage.js \
    map/metatile.js \
    map/division-node.js \
    map/refframe.js \
    map/render-slots.js \
    map/metatile.js \
    map/srs.js \
    map/stats.js \
    map/submesh.js \
    map/surface.js \
    map/surface-sequence.js \
    map/free-layer.js \
    map/glue.js \
    map/texture.js \
    map/tile.js \
    map/tree.js \
    map/url.js \
    map/view.js \
    core.js \
    interface.js \
    config.js \
    update.js > ../build/melown-core-v1-merge-tmp.js

# merge final lib 
cat utils/libs/proj4.js \
    utils/libs/geographics-nomini.js \
    _nominify.js \
    ../build/melown-core-v1-merge-tmp.js > ../build/melown-core-v1-merge.js

# minify lib
java -jar ${CLOSURECOMPILER} --compilation_level ADVANCED_OPTIMIZATIONS --js _minify.js ../build/melown-core-v1-merge-tmp.js --js_output_file ../build/melown-core-v1-tmp.js
cat utils/libs/proj4.js \
    utils/libs/geographics-nomini.js \
    ../build/melown-core-v1-tmp.js > ../build/melown-core-v1-inspector-mini.js
rm ../build/melown-core-v1-tmp.js


# merge melown-core 
cat utils/matrix.js \
    utils/math.js \
    utils/utils.js \
    utils/platform.js \
    utils/url.js \
    utils/http.js \
    renderer/gpu/bbox.js \
    renderer/gpu/device.js \
    renderer/gpu/font.js \
    renderer/gpu/geodata.js \
    renderer/gpu/group.js \
    renderer/gpu/line.js \
    renderer/gpu/mesh.js \
    renderer/gpu/pixel-line.js \
    renderer/gpu/pixel-line3.js \
    renderer/gpu/polygon.js \
    renderer/gpu/program.js \
    renderer/gpu/shaders.js \
    renderer/gpu/text.js \
    renderer/gpu/texture.js \
    renderer/gpu/tile.js \
    renderer/renderer.js \
    renderer/interface.js \
    renderer/bbox.js \
    renderer/camera.js \
    renderer/draw.js \
    renderer/geometry.js \
    renderer/init.js \
    map/map.js \
    ../build/geodata-worker-tmp.js \
    map/geodata/processor.js \
    map/bound-layer.js \
    map/cache.js \
    map/position.js \
    map/camera.js \
    map/config.js \
    map/credit.js \
    map/draw.js \
    map/interface.js \
    map/loader.js \
    map/measure.js \
    map/trajectory.js \
    map/mesh.js \
    map/metanode-tracer.js \
    map/metanode.js \
    map/metastorage.js \
    map/metatile.js \
    map/division-node.js \
    map/refframe.js \
    map/render-slots.js \
    map/metatile.js \
    map/srs.js \
    map/stats.js \
    map/submesh.js \
    map/surface.js \
    map/surface-sequence.js \
    map/free-layer.js \
    map/glue.js \
    map/texture.js \
    map/tile.js \
    map/tree.js \
    map/url.js \
    map/view.js \
    core.js \
    interface.js \
    config.js \
    update.js > ../build/melown-core-v1-merge-tmp2.js

# minify lib2
java -jar ${CLOSURECOMPILER} --compilation_level ADVANCED_OPTIMIZATIONS --js _minify.js ../build/melown-core-v1-merge-tmp2.js --js_output_file ../build/melown-core-v1-tmp2.js
cat utils/libs/proj4.js \
    utils/libs/geographics-nomini.js \
    ../build/melown-core-v1-tmp2.js > ../build/melown-core-v1-mini.js
rm ../build/melown-core-v1-tmp2.js

# remove remaining tmps
rm ../build/geodata-worker-tmp.js 
# rm ../build/melown-core-v1-merge-tmp.js
# rm ../build/melown-core-v1-merge-tmp2.js

cd ..
