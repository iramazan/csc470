var canvas;
var gl;
var shader_program;
var height_map = [];
//var scene_width = 128;
//var scene_height = 128;
var scene_width = 4;
var scene_height = 4;
var vertices = new Float32Array(scene_width * scene_height * 4);
var x_shift = 0;
var y_shift = -1;
var z_shift = -6;
var pitch = -0.3;
var yaw = 0;

// process input keys
document.addEventListener('keydown', function(event) {
    if (event.keyCode == 37) { // left pressed
        var speed = 0.1;
        console.log('Left Arrow Pressed');
        x_shift += speed;
        prep_data();
    }
    else if (event.keyCode == 38) { // up pressed
        var speed = 0.1;
        console.log('Up Arrow Pressed');
        z_shift -= speed;
        prep_data();
    }
    else if (event.keyCode == 39) { // right pressed
        var speed = 0.1;
        console.log('Right Arrow Pressed');
        x_shift -= speed;
        prep_data();
    }
    else if (event.keyCode == 40) { // down pressed
        var speed = 0.1;
        console.log('Down Arrow Pressed');
        z_shift += speed;
        prep_data();
    }
    else if (event.keyCode == 87) { // W pressed
        var speed = 0.01;
        console.log('W pressed');
        pitch -= speed;
        prep_data();
    }
    else if (event.keyCode == 65) { // A pressed
        var speed = 0.01;
        console.log('A pressed');
        yaw += speed;
        prep_data();
    }
    else if (event.keyCode == 83) { // S pressed
        var speed = 0.01;
        console.log('S pressed');
        pitch += speed;
        prep_data();
    }
    else if (event.keyCode == 68) { // D pressed
        var speed = 0.01;
        console.log('D pressed');
        yaw -= speed;
        prep_data();
    }
});

window.onload = function main()
{
    gl_init();
    compile_shaders();
    vert_gen();
    prep_data();
    render();
};

/*
 * Transoform t in interval [a,b] to [c,d]
 * f(t) = c + ((d - c) / (b - a)) * (t - a)
 */
function intv(t, a, b, c, d)
{
    return c + ((d - c) / (b - a)) * (t - a);
}
 
/*
 * Initialize gl context
 */
function gl_init()
{
    canvas = document.getElementById("gl_canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
}

/*
 * Compile Shaders
 */
function compile_shaders()
{
    // vertex shader
    var vert_shader = gl.createShader(gl.VERTEX_SHADER);
    var vert_code = document.getElementById("vertex_shader");
    gl.shaderSource(vert_shader, vert_code.text);
    gl.compileShader(vert_shader);
    if (!gl.getShaderParameter(vert_shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vert_shader));
    }

    // fragment shader
    var frag_shader = gl.createShader(gl.FRAGMENT_SHADER);
    var frag_code = document.getElementById("fragment_shader");
    gl.shaderSource(frag_shader, frag_code.text);
    gl.compileShader(frag_shader);
    if (!gl.getShaderParameter(frag_shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(frag_shader));
    }

    // create shader program
    shader_program = gl.createProgram();
    gl.attachShader(shader_program, vert_shader);
    gl.attachShader(shader_program, frag_shader);
    gl.linkProgram(shader_program);
    if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(shader_program));
    }
    gl.useProgram(shader_program);
}

/*
 * Generate a height map
 */
function vert_gen()
{
    // generation loop
    for (var x = 0; x < scene_width; x++) {
        var column = [];
        for (var y = 0; y < scene_height; y++) {
            var nx = x / scene_width - 0.5;
            var ny = y / scene_height - 0.5;
            var e = 1 * intv(simplex_noise(1 * nx,  1 * ny), -1, 1, 0, 1) +
                0.5 * intv(simplex_noise(2 * nx, 2 * ny), -1, 1, 0, 1) +
                0.25 * intv(simplex_noise(4 * nx, 2 * ny), -1, 1, 0, 1) +
                0.125 * intv(simplex_noise(4 * nx, 4 * ny), -1, 1, 0, 1);
            column.push(Math.pow(e, 1.51));
        }
        height_map.push(column);
    }
    // Create vertices from height map
    for (var i = 0; i < height_map.length; i++) {
        var dim = height_map[i];
        for (var j = 0; j < dim.length; j++) {
            //vertices.push([i-scene_width/2, dim[j], j-scene_height/2, 1]);
            var index = i * scene_width + j;
            vertices[index] = i-scene_width/2;
            vertices[index+1] = dim[j];
            vertices[index+2] = j-scene_width/2;
            vertices[index+3] = 1;
        }
    }
}

/*
 * Prepare data for sending to shaders
 */
function prep_data()
{
    // send data to fragment shader
    var viewt = shift(x_shift, y_shift, z_shift);
    var viewt_location = gl.getUniformLocation(shader_program, "viewt");
    gl.uniformMatrix4fv(viewt_location, false, new Float32Array(viewt));
    var viewrx = rotate_X(pitch);
    var viewrx_location = gl.getUniformLocation(shader_program, "viewrx");
    gl.uniformMatrix4fv(viewrx_location, false, new Float32Array(viewrx));
    var viewry = rotate_Y(yaw);
    var viewry_location = gl.getUniformLocation(shader_program, "viewry");
    gl.uniformMatrix4fv(viewry_location, false, new Float32Array(viewry));
    var proj = persp(90, canvas.width/canvas.height, 1, 1000);
    var proj_location = gl.getUniformLocation(shader_program, "projection");
    gl.uniformMatrix4fv(proj_location, false, new Float32Array(proj));
}

/*
 * Render the scene
 */
function render()
{
    var vertices = [
         3, 0, -3, 1,
        -3, 0, -3, 1,
        -3, 0,  3, 1,
         3, 0,  3, 1,
    ];
    var prev = 0;
    var rloop = function(current) {
        current *= 0.001;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // buffer vertices
        var vert_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        var vert_coord = gl.getAttribLocation(shader_program, "coordinate");
        gl.vertexAttribPointer(vert_coord, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vert_coord);
        // rotate around plane
        var delta = current - prev;
        var rot_anim = rotate_Y(delta);
        var rot_model_location = gl.getUniformLocation(shader_program, "rot_model");
        gl.uniformMatrix4fv(rot_model_location, false, new Float32Array(rot_anim));
        // draw
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length/4);
        prev = current;
        window.requestAnimFrame(render, canvas);
    };
    window.requestAnimationFrame(rloop);
}
