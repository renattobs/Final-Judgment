extends CharacterBody2D

@export var velocidade = 200

func _physics_process(delta):
	var direcao = Input.get_vector("move_left", "move_right", "move_up", "move_down")
	velocity = direcao * velocidade
	move_and_slide()
