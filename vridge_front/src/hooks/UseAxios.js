import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { checkSession } from 'util/util'
import { useNavigate } from 'react-router-dom'

axios.defaults.withCredentials = true
axios.defaults.timeout = 30000

const useAxios = (opts, axiosInstance = axios) => {
  const navigate = useNavigate()
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
  })
  const [trigger, setTrigger] = useState(0)
  const refetch = () => {
    setState({
      ...state,
      loading: true,
    })
    setTrigger(Date.now())
  }
  const fetchData = useCallback(() => {
    axiosInstance(opts)
      .then((data) => {
        setState({
          ...state,
          loading: false,
          data,
        })
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message === 'NEED_ACCESS_TOKEN'
        ) {
          if (checkSession()) {
            window.localStorage.removeItem('VGID')
          }
          navigate('/login', { replace: true })
        } else {
          if (error.response && error.response.data) {
            window.alert(error.response.data.message)
          }
          setState({
            ...state,
            loading: false,
            error,
          })
        }
      })
  }, [])
  useEffect(() => {
    if (!opts.url) {
      return
    }
    fetchData()
  }, [trigger])
  return { ...state, refetch }
}

export default useAxios
