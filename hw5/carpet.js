var number_of_iterations = 1; // number of divisions to perform
var gl; // opengl functions
var canvas;
var shader_program;
var vertices = [
     0.33,  0.33, 0, 1, // top right
     0.33, -0.33, 0, 1, // bottom right
    -0.33, -0.33, 0, 1, // bottom left
    -0.33,  0.33, 0, 1  // top left
];
var tex_coords = [
    1.0, 1.0,// top right
    1.0, 0.0,// bottom right
    0.0, 0.0,// bottom left
    0.0, 1.0// top left
];
var texture;
var is_rotating = false;
var is_reversed = false;
var theta = 0;
var eye_vec = [0, 0, 1];
var target_vec = [0, 0, 0];
var up_vec = [0, 1, 0];

window.onload = function main()
{
    gl_init(); // gl setup
    doc_init(); // document setup
    compile_shaders(); // shader program
    texture_init(); // load texture from file
    draw(0); // do the actual work
};

// Initialize scripting for html document
function doc_init()
{
    // scripting for iteration slider
    var iter_slider = document.getElementById("iter_slider");
    var iter_label = document.getElementById("iter_label");
    var iter_func = function() {
        iter_label.textContent = iter_slider.value;
        number_of_iterations = iter_slider.value;
        gl.clear(gl.COLOR_BUFFER_BIT);
        draw(0);
    };
    iter_slider.addEventListener("input", iter_func, false);
     
    // scripting for rotate button
    var rotate_button = document.getElementById("rotate_button");
    var rotate_func = function() {
        is_rotating = !is_rotating;
        var prev = 0;
        var animate = function(current) {
            current *= 0.003;
            var delta = current - prev;
            prev = current;
            gl.clear(gl.COLOR_BUFFER_BIT);
            is_reversed ? theta += delta : theta -= delta;
            draw(0);
            if (is_rotating) {
                window.requestAnimationFrame(animate);
            }
        };
        if (is_rotating) {
            window.requestAnimationFrame(animate);
        }
    };
    rotate_button.addEventListener("click", rotate_func, false);

    // scripting for canvas click event
    var canvas_func = function() {
        is_reversed = !is_reversed;
    };
    canvas.addEventListener("click", canvas_func, false);

    // handle keyboard input for camera movement
    document.addEventListener('keydown', function(event) {
        if (event.keyCode == 37) { // left pressed
            console.log('Left Arrow Pressed');
            eye_vec[0] = Math.sin(eye_vec[0] + 0.1);
            eye_vec[2] = Math.cos(eye_vec[2] + 0.1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            draw(0);
        }
        else if (event.keyCode == 38) { // up pressed
            console.log('Up Arrow Pressed');
        }
        else if (event.keyCode == 39) { // right pressed
            console.log('Right Arrow Pressed');
            eye_vec[0] = Math.sin(eye_vec[0] - 0.1);
            eye_vec[2] = Math.cos(eye_vec[2] - 0.1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            draw(0);
        }
        else if (event.keyCode == 40) { // down pressed
            console.log('Down Arrow Pressed');
        }
    });
}

// Initialize opengl
function gl_init()
{
    canvas = document.getElementById("gl_canvas");
    try {
        gl = canvas.getContext('experimental-webgl');
    } catch (e) {
        throw new Error('WebGL could not be found');
    }
    // prepare viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // transform vertices to world space
    for (var i = 0; i < vertices.length; i+=4) {
        vertices[i] *= canvas.width;
        vertices[i+1] *= canvas.height;
    }
}

// compile shaders and create shader program
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

// Create texture variable and load image from file
function texture_init() {
    texture = gl.createTexture();
    const image = new Image();
    image.src = "texture.png";
    image.addEventListener('load', function(){
        gl.bindTexture(gl.TEXTURE_2d, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // different requirements if image is power of 2 or not
        if (image.width & (image.width - 1) == 0 &&
            image.height & (image.height - 1) == 0) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.clear(gl.COLOR_BUFFER_BIT);
        draw(0);
    });
}

// prepare data and render
function draw(n, shift_x = 0, shift_y = 0)
{
    // prepare data to send to graphics card
    // send data to vertex shader
    var factor = Math.pow(0.333333, n);
    var factor_location = gl.getUniformLocation(shader_program, "factor");
    gl.uniform1f(factor_location, factor);
    var width_location = gl.getUniformLocation(shader_program, "width");
    gl.uniform1f(width_location, canvas.width);
    var height_location = gl.getUniformLocation(shader_program, "height");
    gl.uniform1f(height_location, canvas.height);
    var eye_location = gl.getUniformLocation(shader_program, "eye");
    gl.uniform3fv(eye_location, eye_vec);
    var target_location = gl.getUniformLocation(shader_program, "target");
    gl.uniform3fv(target_location, target_vec);
    var up_location = gl.getUniformLocation(shader_program, "up");
    gl.uniform3fv(up_location, up_vec);
    var theta_location = gl.getUniformLocation(shader_program, "theta");
    gl.uniform1f(theta_location, theta);
    var shift_location = gl.getUniformLocation(shader_program, "shift");
    gl.uniform2fv(shift_location, new Float32Array([shift_x, shift_y]));

    // send data to fragment shader
    var normal_location = gl.getUniformLocation(shader_program, "normal");
    gl.uniform4fv(normal_location, surface_normal(vertices, 4, 8, 0, shift_x, shift_y));
    var amb_mat_location = gl.getUniformLocation(shader_program, "ambient_mat");
    gl.uniform3fv(amb_mat_location, new Float32Array([
        document.getElementById('amb_R').value,
        document.getElementById('amb_G').value,
        document.getElementById('amb_B').value,
    ]));
    var diff_mat_location = gl.getUniformLocation(shader_program, "diffuse_mat");
    gl.uniform3fv(diff_mat_location, new Float32Array([
        document.getElementById('diff_R').value,
        document.getElementById('diff_G').value,
        document.getElementById('diff_B').value,
    ]));
    var spec_mat_location = gl.getUniformLocation(shader_program, "specular_mat");
    gl.uniform3fv(spec_mat_location, new Float32Array([
        document.getElementById('spec_R').value,
        document.getElementById('spec_G').value,
        document.getElementById('spec_B').value,
    ]));
    var light_color_location = gl.getUniformLocation(shader_program, "light_color");
    gl.uniform3fv(light_color_location, new Float32Array([
        document.getElementById('light_R').value,
        document.getElementById('light_G').value,
        document.getElementById('light_B').value,
    ]));
    var light_pos_location = gl.getUniformLocation(shader_program, "light_pos");
    gl.uniform3fv(light_pos_location, new Float32Array([
        document.getElementById('light_x').value,
        document.getElementById('light_y').value,
        document.getElementById('light_z').value,
    ]));
    var shininess_location = gl.getUniformLocation(shader_program, "shininess");
    gl.uniform1f(shininess_location, document.getElementById('shininess').value);

    // send texture info
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    var tex_sample_location = gl.getUniformLocation(shader_program, "tex_sample");
    gl.uniform1i(tex_sample_location, 0);

    // buffer vertices
    var vert_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    var vert_coord = gl.getAttribLocation(shader_program, "coordinate");
    gl.vertexAttribPointer(vert_coord, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vert_coord);
    // buffer texture coordinates
    var tex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tex_coords), gl.STATIC_DRAW);
    var tex_coord = gl.getAttribLocation(shader_program, "tex_coord");
    gl.vertexAttribPointer(tex_coord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tex_coord);
    // draw
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // perform iterations
    n++;
    if (n < number_of_iterations) {
        var shift_xnp = shift_x / 3 + (0.66 * canvas.width);
        var shift_xnm = shift_x / 3 - (0.66 * canvas.width);
        var shift_ynp = shift_y / 3 + (0.66 * canvas.height);
        var shift_ynm = shift_y / 3 - (0.66 * canvas.height);
        draw(n, shift_xnp, shift_ynp); // top right
        draw(n, shift_xnm, shift_ynm); // bottom left
        draw(n, -1*(shift_xnm), shift_ynm); // bottom right
        draw(n, -1*(shift_xnp), shift_ynp); // top left
        draw(n, shift_xnm, shift_y/3); // mid right
        draw(n, shift_xnp, shift_y/3); // mid left
        draw(n, shift_x/3, shift_ynm); // bottom
        draw(n, shift_x/3, shift_ynp); // top
    }
}
